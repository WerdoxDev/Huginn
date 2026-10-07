import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { HuginnClient } from "@huginnjs/api";
import { analytics, type APIPublicUser, type GatewayReadyData, type Snowflake } from "@huginnjs/shared";
import { fetchInstanceUrls, probeInstanceUrls, tryAccessAddresses } from "@lib/instances";
import { getInitialChannels, getInitialRelationships, queryClient } from "@lib/queries";
import { updateUser } from "@lib/query-utils";
import { VoiceBridge } from "@lib/voice/voice-bridge";
import { useStore } from "zustand";

import type { Environment, InstanceUrls } from "@/types";

import { clientStore } from "./clientStoreState";
import { storageStore } from "./storageStore";
import { windowStore } from "./windowStore";

const store = clientStore;

function setClientUrls(urls: InstanceUrls) {
   store.setState({
      urls,
      hostnames: {
         api: new URL(urls.api).origin,
         cdn: new URL(urls.cdn).origin,
         voice: new URL(urls.voice).origin,
      },
   });
}

export function setHostnamesFromSettings() {
   setClientUrls(storageStore.getState().getCachedValue("settings").currentUrls);
}

export async function selectStartupInstanceAddress(): Promise<void> {
   const storage = storageStore.getState();
   const settings = storage.getCachedValue("settings");
   const instances = storage.getCachedValue("instances");
   const instance = instances.find((item) => item.id === settings.currentInstanceId);
   if (!instance) throw new Error("Selected instance was not found");

   const { address, value } = await tryAccessAddresses(instance, settings.currentAccessAddress, async (address) => {
      const discovery = await fetchInstanceUrls(address, instance);
      await probeInstanceUrls(discovery.urls);
      setClientUrls(discovery.urls);
      await initializeClient();
      return discovery;
   });
   await storage.setValue("settings", { ...settings, currentAccessAddress: address, currentUrls: value.urls });
   if (value.serverId && instance.serverId !== value.serverId) {
      await storage.setValue(
         "instances",
         instances.map((item) => (item.id === instance.id ? { ...item, serverId: value.serverId } : item)),
      );
   }
}

function updateUsersFromReadyData(d: GatewayReadyData) {
   const channelUsers = d.privateChannels.flatMap((x) => x.recipients);
   const relationUsers = d.relationships.map((x) => x.user);

   const userSources = [channelUsers, relationUsers].flat();
   const userMap = new Map<Snowflake, APIPublicUser>();

   for (const user of userSources) {
      userMap.set(user.id, { ...userMap.get(user.id), ...user });
   }

   userMap.set(d.user.id, d.user);

   for (const [_userId, user] of userMap) {
      updateUser(user);
   }
}

const ENV_TO_BROWSER_MAP: Record<Environment, string> = {
   desktop: "Huginn Client",
   android: "Huginn Mobile",
   browser: "Huginn Web",
};

const NODE_PLATFORM_TO_OS: Record<string, string> = {
   win32: "windows",
   darwin: "macos",
   linux: "linux",
};

const NAVIGATOR_PLATFORM_TO_OS: Record<string, string> = {
   MacIntel: "macos",
   Win32: "windows",
   "Linux x86_64": "linux",
};

const NODE_PLATFORM_TO_UPDATE_ROUTE: Record<string, string | undefined> = {
   win32: "windows",
   linux: "linux",
};

function getChromeVersion() {
   var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
   return raw ? parseInt(raw[2], 10) : undefined;
}

export async function initializeClient() {
   const huginnWindowStore = windowStore.getState();
   let thisStore = store.getState();

   if (thisStore.client !== undefined) return;

   const osInfo = huginnWindowStore.environment === "desktop" ? await window.electronAPI.getOsInfo() : undefined;
   const deviceInfo = Capacitor.getPlatform() === "android" ? await Device.getInfo() : undefined;
   const platform = osInfo?.platform ? NODE_PLATFORM_TO_OS[osInfo.platform] : (NAVIGATOR_PLATFORM_TO_OS[navigator.platform] ?? "unknown");
   const arch = osInfo?.arch ?? undefined;
   const chromeVersion = osInfo?.chromeVersion ?? getChromeVersion()?.toString() ?? undefined;
   const electronVersion = osInfo?.electronVersion ?? undefined;
   const osVersion = osInfo?.version ?? deviceInfo?.osVersion ?? undefined;

   const client = new HuginnClient({
      rest: { api: thisStore.urls!.api },
      cdn: { url: thisStore.urls!.cdn },
      gateway: {
         url: thisStore.urls!.gateway,
         intents: 0,
         properties: {
            browser: ENV_TO_BROWSER_MAP[huginnWindowStore.environment],
            os: platform,
            osVersion: osVersion,
            osArch: arch,
            device: deviceInfo?.model ?? ENV_TO_BROWSER_MAP[huginnWindowStore.environment] ?? undefined,
            browserUserAgent: navigator.userAgent,
            browserVersion: chromeVersion,
            electronVersion: electronVersion,
            clientVersion: huginnWindowStore.version,
         },
         createSocket(url) {
            return new WebSocket(url);
         },
      },
      voice: {
         class: VoiceBridge,
         url: thisStore.urls!.voice,
         createSocket(url) {
            return new WebSocket(url);
         },
      },
   });

   store.setState({ client });

   if (window.opener) return;

   let connected = false;
   try {
      connected = await client.connect();
   } catch {
      // A failed handshake is another startup address failure.
   }
   if (!connected) {
      client.gateway.close();
      store.setState({ client: undefined });
      throw new Error("Gateway connection failed");
   }

   thisStore = store.getState();

   const updateRoute = osInfo?.platform ? NODE_PLATFORM_TO_UPDATE_ROUTE[osInfo.platform] : undefined;
   if (window.electronAPI && thisStore.hostnames.api && updateRoute) {
      const url = `${thisStore.urls!.api}/update/${updateRoute}`;
      window.electronAPI.setUpdateUrl(url);
   }

   if (huginnWindowStore.environment === "android" && thisStore.hostnames.api) {
      const url = `${thisStore.urls!.api}/update/android`;
      console.log(url, import.meta.env.VITE_PUBLIC_DEV_UPDATE_PUBLISHER_URL);
      if (import.meta.env.VITE_PUBLIC_DEV_UPDATE_PUBLISHER_URL) {
         store.setState({ androidUpdateUrl: import.meta.env.VITE_PUBLIC_DEV_UPDATE_PUBLISHER_URL });
      } else {
         store.setState({ androidUpdateUrl: url });
      }
   }

   const unlisteners: Array<(() => void) | undefined> = [];

   unlisteners.push(
      thisStore.client?.gateway.listen("ready", async (d) => {
         store.setState({ readyData: d, userSettings: d.userSettings });

         updateUsersFromReadyData(d);

         store.setState((state) => ({ readyCount: state.readyCount + 1 }));
         if (store.getState().readyCount === 1) return;

         // queries need to be reinitialized when client receives ready again which means a complete reset.
         await queryClient.invalidateQueries({ queryKey: ["messages"] });
         queryClient.setQueryData(["relationships"], getInitialRelationships());
         queryClient.setQueryData(["channels", "@me"], getInitialChannels());
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("presence_update", (d) => {
         updateUser(d.user);
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("user_update", (d) => {
         updateUser(d);
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("channel_recipient_add", (d) => {
         updateUser(d.user);
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("relationship_add", (d) => {
         updateUser(d.user);
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("channel_create", (d) => {
         for (const user of d.recipients) {
            updateUser(user);
         }
      }),
   );

   unlisteners.push(
      thisStore.client?.gateway.listen("settings_update", (d) => {
         thisStore.setUserSettings(d);
      }),
   );

   unlisteners.push(thisStore.client?.gateway.listen("status_changed", (status) => store.setState({ gatewayStatus: status })));
   unlisteners.push(thisStore.client?.voice.listen("status_changed", (status) => store.setState({ voiceStatus: status })));
   store.setState({ gatewayStatus: thisStore.client?.gateway.status, voiceStatus: thisStore.client?.voice.status });

   store.setState({ isInitialized: true });

   return () => {
      for (const unlisten of unlisteners) {
         unlisten?.();
      }
   };
}

export function useClient() {
   // biome-ignore lint/style/noNonNullAssertion: This cannot be null
   return useStore(store, (selector) => selector.client);
}

export function useClientStore() {
   return useStore(store);
}

export { clientStore };
