import { type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppPresence } from "@/types";
import { convertToAppPresence } from "@lib/utils";

const initialStore = () => ({
   presences: [] as AppPresence[],
   thisPresence: {} as AppPresence,
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      updatePresence: (userId: Snowflake, options: Partial<AppPresence>) =>
         set(
            produce((draft: StoreType) => {
               const existingIndex = draft.presences.findIndex((x) => x.userId === userId);
               if (existingIndex !== -1) {
                  draft.presences[existingIndex] = {
                     ...draft.presences[existingIndex],
                     ...options,
                  };
               } else {
                  draft.presences.push(options as AppPresence);
               }
            }),
         ),
   })),
);

export function initializePresence() {
   const client = clientStore.getState().client;

   if (!client) {
      return;
   }

   const unlisten = client.gateway.listen("ready", (d) => {
      const thisStore = store.getState();
      store.setState({ presences: [] });

      const presence: AppPresence = {
         userId: d.user.id,
         status: d.userSettings.status || "online",
         activeSessions: [client.gateway.sessionId!],
      };
      thisStore.updatePresence(d.user.id, presence);
      store.setState({ thisPresence: presence });

      if (d.presences) {
         for (const presence of d.presences) {
            thisStore.updatePresence(presence.user.id, convertToAppPresence(presence));
         }
      }
   });

   const unlisten2 = client.gateway.listen("presence_update", (d) => {
      store.getState().updatePresence(d.user.id, convertToAppPresence(d));
   });

   const unlisten3 = client.gateway.listen("session_update", (d) => {
      if (!d.status || !client.user) {
         return;
      }

      store.setState((state) => ({ thisPresence: { ...state.thisPresence, status: d.status } }));
      store.getState().updatePresence(client.user.id, { status: d.status });
   });

   return () => {
      unlisten();
      unlisten2();
      unlisten3();
   };
}

export function usePresence(userId?: Snowflake) {
   const thisStore = useStore(store);

   return useMemo(() => thisStore.presences.find((x) => x.userId === userId), [thisStore.presences, userId]);
}

export function usePresences(userIds: Snowflake[]) {
   const thisStore = useStore(store);
   const presences = useMemo(() => thisStore.presences.filter((x) => userIds.includes(x.userId)), [thisStore.presences, userIds]);

   function getPresence(userId: Snowflake) {
      return presences.find((x) => x.userId === userId);
   }

   return { presences, getPresence };
}

export const presenceStore = store;
