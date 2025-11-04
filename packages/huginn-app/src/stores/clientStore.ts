import { HuginnClient, type VoiceStatus } from "@huginn/api";
import { type APIPublicUser, error, type GatewayReadyData, type GatewayStatus, log, type Snowflake, type UserSettings } from "@huginn/shared";
import { createStore, useStore } from "zustand";
import { storageStore } from "./storageStore";
import { updateUser } from "@lib/query-utils";
import { VoiceBridge } from "@lib/voice/voice-bridge";

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
});

// type StoreType = ReturnType<typeof initialStore>;

const store = createStore(() => initialStore());

export async function setHostnamesFromExternal() {
   log("app:client-store", "default", "set hostnames from external");

   const settings = storageStore.getState().getCachedValue("settings");
   let response: Response | undefined;

   try {
      response = await fetch(settings.externalHostnamesUrl, { cache: "no-cache" });
      const json = await response?.json();
      store.setState({ hostnames: { api: json.api, cdn: json.cdn, voice: json.voice } });
      return true;
   } catch (e) {
      error("app:client-store", "Error fetching external hostnames", e);

      return false;
   }
}

export function setHostnamesFromSettings() {
   log("app:client-store", "default", "set hostnames from settings");

   const settings = storageStore.getState().getCachedValue("settings");
   store.setState({
      hostnames: { api: settings.apiHostname, cdn: settings.cdnHostname, voice: settings.voiceHostname },
   });
}

export function initializeClient() {
   log("app:client-store", "default", "initialize client");

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

   const unlisteners: Array<(() => void) | undefined> = [];

   unlisteners.push(
      thisStore.client?.gateway.listen("ready", (d) => {
         store.setState({ readyData: d, userSettings: d.userSettings });

         const channelUsers = d.privateChannels.flatMap((x) => x.recipients);
         const relationUsers = d.relationships.map((x) => x.user);
         // const presenceUsers = d.presences.map((x) => x.user);

         const userSources = [channelUsers, relationUsers].flat();
         const userMap = new Map<Snowflake, APIPublicUser>();

         for (const user of userSources) {
            userMap.set(user.id, { ...userMap.get(user.id), ...user });
         }

         userMap.set(d.user.id, d.user);

         for (const [_userId, user] of userMap) {
            updateUser(user);
         }
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
         store.setState((state) => ({ userSettings: state.userSettings ? { ...state.userSettings, ...d } : undefined }));
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
