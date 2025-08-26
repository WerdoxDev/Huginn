import type { Snowflake, UserPresence } from "@huginn/shared";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppPresence } from "@/types";
import { convertToAppPresence } from "@lib/utils";

const initialStore = () => ({
   presences: [] as AppPresence[],
});

type StoreType = ReturnType<typeof initialStore>;

const store = createStore(
   combine(initialStore(), (set) => ({
      updatePresence: (presence: UserPresence) =>
         set(
            produce((draft: StoreType) => {
               const existingIndex = draft.presences.findIndex((x) => x.userId === presence.user.id);
               if (existingIndex !== -1) {
                  draft.presences[existingIndex] = { ...draft.presences[existingIndex], ...convertToAppPresence(presence) };
               } else {
                  draft.presences.push(convertToAppPresence(presence));
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
      store.setState({ presences: [] });
      store.getState().updatePresence({
         user: d.user,
         status: clientStore.getState().readyData?.userSettings?.status || "offline",
         activeSessions: [client.gateway.sessionId!],
      });

      if (d.presences) {
         for (const presence of d.presences) {
            store.getState().updatePresence(presence);
         }
      }
   });

   const unlisten2 = client.gateway.listen("presence_update", (d) => {
      store.getState().updatePresence(d);
   });

   return () => {
      unlisten();
      unlisten2();
   };
}

export function usePresence(userId: Snowflake) {
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
