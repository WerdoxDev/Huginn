import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { HuginnClient, type VoiceStatus } from "@huginn/api";
import {
   analytics,
   type APIPublicUser,
   error,
   type GatewayReadyData,
   type GatewayStatus,
   log,
   type Snowflake,
   type UserSettings,
} from "@huginn/shared";
import { getInitialChannels, getInitialRelationships, queryClient } from "@lib/queries";
import { updateUser } from "@lib/query-utils";
import { VoiceBridge } from "@lib/voice/voice-bridge";
import { createStore, useStore } from "zustand";

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
});

// type StoreType = ReturnType<typeof initialStore>;

const store = createStore(() => initialStore());

export type ExternalHostnameStatus = "network_error" | "invalid_response" | "success";
export type ExternalHostnameResult = {
   success: boolean;
   status: ExternalHostnameStatus;
};

export async function setHostnamesFromExternal(): Promise<ExternalHostnameResult> {
   log("app:client-store", "default", "set hostnames from external");

   const settings = storageStore.getState().getCachedValue("settings");
   const activePreset = (settings.hostnamePresets ?? []).find((p) => p.name === settings.activePresetName);
   let response: Response | undefined;

   if (!activePreset) {
      return { success: false, status: "invalid_response" } as ExternalHostnameResult;
   }

   try {
      response = await fetch(activePreset.externalHostnamesUrl, { cache: "no-cache" });
      const json = response.headers.get("content-type")?.includes("application/json") ? await response?.json() : undefined;
      if (!response?.ok || !json || !json?.api || !json?.cdn || !json?.voice) {
         error("app:client-store", "invalid response fetching external hostnames", response);
         return { success: false, status: "invalid_response" } as ExternalHostnameResult;
      }

      store.setState({ hostnames: { api: json.api, cdn: json.cdn, voice: json.voice } });
      return { success: true, status: "success" } as ExternalHostnameResult;
   } catch (e) {
      error("app:client-store", "error fetching external hostnames", e);

      return { success: false, status: "network_error" } as ExternalHostnameResult;
   }
}

export function setHostnamesFromSettings() {
   log("app:client-store", "default", "set hostnames from settings");

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
   store.setState({ readyData: d, userSettings: d.userSettings });

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

export async function initializeClient() {
   log("app:client-store", "default", "initialize client");

   const huginnWindowStore = windowStore.getState();
   let thisStore = store.getState();

   if (thisStore.client === undefined) {
      const client = new HuginnClient({
         rest: { api: `${thisStore.hostnames.api}/api` },
         cdn: { url: `${thisStore.hostnames.cdn}/cdn` },
         gateway: {
            url: `${thisStore.hostnames.api}/gateway`,
            intents: 0,
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
   } else {
      return;
   }

   thisStore = store.getState();

   if (window.electronAPI && thisStore.hostnames.api) {
      const url = `${thisStore.hostnames.api}/api/update/win`;
      window.electronAPI.setUpdateUrl(url);
   }

   if (huginnWindowStore.environment === "android" && thisStore.hostnames.api) {
      const url = `${thisStore.hostnames.api}/api/update/android`;
      await CapacitorUpdater.setUpdateUrl({ url });
   }

   const unlisteners: Array<(() => void) | undefined> = [];

   unlisteners.push(
      thisStore.client?.gateway.listen("ready", async (d) => {
         updateUsersFromReadyData(d);

         store.setState((state) => ({ readyCount: state.readyCount + 1 }));
         if (store.getState().readyCount === 1) return;

         // queries need to be reinitialized when client receives ready again which means a complete reset.
         await queryClient.invalidateQueries({ queryKey: ["messages"] });
         queryClient.setQueryData(["relationships"], getInitialRelationships());
         queryClient.setQueryData(["channels", "@me"], getInitialChannels());

         analytics.setDefaultAttributes({ "user.id": d.user.id });
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
         store.setState((state) => ({
            userSettings: state.userSettings ? { ...state.userSettings, ...d } : undefined,
         }));
      }),
   );

   unlisteners.push(thisStore.client?.gateway.listen("status_changed", (status) => store.setState({ gatewayStatus: status })));
   unlisteners.push(thisStore.client?.voice.listen("status_changed", (status) => store.setState({ voiceStatus: status })));

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
