import { HuginnClient } from "@huginn/api";
import { type APIPublicUser, error, type GatewayReadyData, log, type PresenceUser, type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { settingsStore } from "./settingsStore";

export let client: HuginnClient | undefined = undefined;

const initialStore = () => ({
   hostnames: {
      api: "",
      cdn: "",
      voice: ""
   },
   users: [] as APIPublicUser[],
   readyData: undefined as GatewayReadyData | undefined,
   isInitialized: false,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      updateUser: (user: PresenceUser) =>
         set(
            produce((draft: StoreType) => {
               const index = draft.users.findIndex((x) => x.id === user.id);
               if (index !== -1) {
                  draft.users[index] = { ...draft.users[index], ...user };
               } else {
                  draft.users.push(user as APIPublicUser);
               }
            }),
         ),
      setReadyData: (data: GatewayReadyData) => set({ readyData: data })
   })),
);

export async function setHostnamesFromExternal() {
   log("app:client-store", "default", "set hostnames from external");

   const settings = settingsStore.getState();
   let response: Response | undefined;

   try {
      response = (await fetch(settings.externalHostnamesUrl, { cache: "no-cache" }));
      const json = await response?.json();
      store.setState({ hostnames: { api: json.api, cdn: json.cdn, voice: json.voice } });
      return true;
   } catch (e) {
      error("app:client-store", "Error fetching external hostnames", e);

      return false;
      // const modals = modalsStore.getState();
      // modals.updateModals({ info: { isOpen: true, ...messages.externalHostnamesError(), status: "error", action: { cancel: { text: "Close", callback: () => modals.updateModals({ info: { isOpen: false } }) }, confirm: { text: "Open Settings", callback: () => modals.updateModals({ info: { isOpen: false }, settings: { isOpen: true } }) } }, closable: true } })
   }
}

export function setHostnamesFromSettings() {
   log("app:client-store", "default", "set hostnames from settings");

   const settings = settingsStore.getState();
   store.setState({ hostnames: { api: settings.apiHostname, cdn: settings.cdnHostname, voice: settings.voiceHostname } });
}

export function initializeClient() {
   log("app:client-store", "default", "initialize client");

   const thisStore = store.getState();
   if (client === undefined) {
      client = new HuginnClient({
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
      });

      client.gateway.connect();
   } else {
      return;
   }

   if (window.electronAPI && thisStore.hostnames.api) {
      const url = `${thisStore.hostnames.api}/api/update/win`;
      window.electronAPI.setUpdateUrl(url);
   }

   const unlisten = client?.gateway.listen("ready", (d) => {
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

      store.setState({ users: Array.from(userMap.values()) });
   });

   const unlisten2 = client?.gateway.listen("presence_update", (d) => {
      store.getState().updateUser(d.user);
   });

   const unlisten3 = client?.gateway.listen("user_update", (d) => {
      store.getState().updateUser(d);
   });

   const unlisten4 = client?.gateway.listen("channel_recipient_add", (d) => {
      store.getState().updateUser(d.user);
   });

   const unlisten5 = client?.gateway.listen("relationship_add", (d) => {
      console.log(d);
      store.getState().updateUser(d.user);
   });

   const unlisten6 = client?.gateway.listen("channel_create", (d) => {
      for (const user of d.recipients) {
         store.getState().updateUser(user);
      }
   });

   store.setState({ isInitialized: true });

   return () => {
      unlisten?.();
      unlisten2?.();
      unlisten3?.();
      unlisten4?.();
      unlisten5?.();
      unlisten6?.();
   };
}

export function useClient() {
   // biome-ignore lint/style/noNonNullAssertion: This cannot be null
   return client!;
}

export function useClientStore() {
   return useStore(store);
}

export const clientStore = store;
