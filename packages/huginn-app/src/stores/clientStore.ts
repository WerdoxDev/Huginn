import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { HuginnClient, type VoiceStatus } from "@huginn/api";
import {
   analytics,
   type APIPublicUser,
   error,
   type GatewayReadyData,
   type GatewayStatus,
   recordSpanError,
   type Snowflake,
   type UserSettings,
} from "@huginn/shared";
import { getInitialChannels, getInitialRelationships, queryClient } from "@lib/queries";
import { updateUser } from "@lib/query-utils";
import { VoiceBridge } from "@lib/voice/voice-bridge";
import { createStore, useStore } from "zustand";
import { combine, subscribeWithSelector } from "zustand/middleware";

import type { Environment } from "@/types";

import { storageStore } from "./storageStore";
import { windowStore } from "./windowStore";

const initialStore = () => ({
   hostnames: {
      api: "",
      cdn: "",
      voice: "",
   },
   voiceStatus: undefined as VoiceStatus | undefined,
   gatewayStatus: undefined as GatewayStatus | undefined,
   readyData: undefined as GatewayReadyData | undefined,
   isInitialized: false,
   userSettings: undefined as UserSettings | undefined,
   client: undefined as HuginnClient<VoiceBridge> | undefined,
   readyCount: 0,
   androidUpdateUrl: undefined as string | undefined,
});

// type StoreType = ReturnType<typeof initialStore> & {
//    setUserSettings: (settings: Partial<UserSettings>) => void;
// };

const store = createStore(
   subscribeWithSelector(
      combine(initialStore(), (set) => ({
         setUserSettings: (settings: Partial<UserSettings>) =>
            set((state) => ({ userSettings: state.userSettings ? { ...state.userSettings, ...settings } : undefined })),
      })),
   ),
);

export type ExternalHostnameStatus = "network_error" | "invalid_response" | "success";
export type ExternalHostnameResult = {
   success: boolean;
   status: ExternalHostnameStatus;
};

export async function setHostnamesFromExternal(): Promise<ExternalHostnameResult> {
   return analytics.startActiveSpan("clientStore.setHostnamesFromExternal", async (span) => {
      try {
         const settings = storageStore.getState().getCachedValue("settings");
         const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
         let response: Response | undefined;

         span.setAttributes({
            "presets.count": settings.hostnamePresets?.length ?? 0,
            "presets.active_preset_name": settings.activePresetName ?? "",
            "active_preset.has_external_hostnames_url": !!activePreset?.externalHostnamesUrl,
         });

         if (!activePreset) {
            return { success: false, status: "invalid_response" } as ExternalHostnameResult;
         }

         response = await fetch(activePreset.externalHostnamesUrl, { cache: "no-cache" });
         const json = response.headers.get("content-type")?.includes("application/json") ? await response?.json() : undefined;
         if (!response?.ok || !json || !json?.api || !json?.cdn || !json?.voice) {
            error("app:client-store", "invalid response fetching external hostnames", response);
            return { success: false, status: "invalid_response" } as ExternalHostnameResult;
         }

         store.setState({ hostnames: { api: json.api, cdn: json.cdn, voice: json.voice } });
         return { success: true, status: "success" } as ExternalHostnameResult;
      } catch (e) {
         recordSpanError(e);
         return { success: false, status: "network_error" } as ExternalHostnameResult;
      }
   });
}

export function setHostnamesFromSettings() {
   const settings = storageStore.getState().getCachedValue("settings");
   const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
   store.setState({
      hostnames: {
         api: activePreset?.apiHostname ?? "",
         cdn: activePreset?.cdnHostname ?? "",
         voice: activePreset?.voiceHostname ?? "",
      },
   });
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

function getChromeVersion() {
   var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
   return raw ? parseInt(raw[2], 10) : undefined;
}

export async function initializeClient() {
   const huginnWindowStore = windowStore.getState();
   let thisStore = store.getState();

   const osInfo = huginnWindowStore.environment === "desktop" ? await window.electronAPI.getOsInfo() : undefined;
   const deviceInfo = Capacitor.getPlatform() === "android" ? await Device.getInfo() : undefined;
   const platform = osInfo?.platform ? NODE_PLATFORM_TO_OS[osInfo.platform] : (NAVIGATOR_PLATFORM_TO_OS[navigator.platform] ?? "unknown");
   const arch = osInfo?.arch ?? undefined;
   const chromeVersion = osInfo?.chromeVersion ?? getChromeVersion()?.toString() ?? undefined;
   const electronVersion = osInfo?.electronVersion ?? undefined;
   const osVersion = osInfo?.version ?? deviceInfo?.osVersion ?? undefined;

   if (thisStore.client !== undefined) return;

   const client = new HuginnClient({
      rest: { api: `${thisStore.hostnames.api}/api` },
      cdn: { url: `${thisStore.hostnames.cdn}/cdn` },
      gateway: {
         url: `${thisStore.hostnames.api}/gateway`,
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
         url: `${thisStore.hostnames.voice}/voice`,
         createSocket(url) {
            return new WebSocket(url);
         },
      },
   });
   store.setState({ client });

   await client?.connect();

   thisStore = store.getState();

   if (window.electronAPI && thisStore.hostnames.api) {
      const url = `${thisStore.hostnames.api}/api/update/win`;
      window.electronAPI.setUpdateUrl(url);
   }

   if (huginnWindowStore.environment === "android" && thisStore.hostnames.api) {
      const url = `${thisStore.hostnames.api}/api/update/android`;
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

export const clientStore = store;
