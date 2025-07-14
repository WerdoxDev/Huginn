import { HuginnClient } from "@huginn/api";
import type { APIPublicUser, GatewayReadyData, PresenceUser, Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

export let client: HuginnClient | undefined = undefined;

const initialStore = () => ({
   hostnames: {
      api: "",
      cdn: "",
      voice: ""
   },
   users: [] as APIPublicUser[],
   readyData: undefined as GatewayReadyData | undefined
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

export function initializeClient() {
   const thisStore = store.getState();
   if (!window.location.pathname.includes("splashscreen") && client === undefined) {
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

export function useAPI() {
   return useStore(store);
}

export const apiStore = store;
