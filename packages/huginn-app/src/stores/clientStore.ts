import { HuginnClient } from "@huginn/api";
import { type APIPublicUser, error, type GatewayReadyData, type GatewayStatus, log, type Snowflake, type VoiceStatus } from "@huginn/shared";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { filesStore } from "./filesStore";
import { updateUser } from "@lib/query-utils";

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
   client: undefined as HuginnClient | undefined,
});

// type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      setGatewayStatus: (status: GatewayStatus) => set({ gatewayStatus: status }),
      setVoiceStatus: (status: VoiceStatus) => set({ voiceStatus: status }),
      setReadyData: (data: GatewayReadyData) => set({ readyData: data }),
   })),
);

export async function setHostnamesFromExternal() {
   log("app:client-store", "default", "set hostnames from external");

   const settings = filesStore.getState();
   let response: Response | undefined;

   try {
      response = await fetch(settings.settings.externalHostnamesUrl, { cache: "no-cache" });
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

   const settings = filesStore.getState();
   store.setState({ hostnames: { api: settings.settings.apiHostname, cdn: settings.settings.cdnHostname, voice: settings.settings.voiceHostname } });
}

export function initializeClient() {
   log("app:client-store", "default", "initialize client");

   let thisStore = store.getState();
   if (thisStore.client === undefined) {
      store.setState({
         client: new HuginnClient({
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
               // url: `http://192.168.178.51:3003/voice`,
               url: `${thisStore.hostnames.voice}/voice`,
               createSocket(url) {
                  return new WebSocket(url);
               },
            },
         }),
      });

      store.getState().client?.gateway.connect();
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
         store.getState().setReadyData(d);

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

   unlisteners.push(thisStore.client?.gateway.listen("status_changed", (status) => store.getState().setGatewayStatus(status)));
   unlisteners.push(thisStore.client?.voice.listen("status_changed", (status) => store.getState().setVoiceStatus(status)));

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
