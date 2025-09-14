import { ActivityType, error, log, type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppPresence } from "@/types";
import { convertToAppPresence } from "@lib/utils";
import { filesStore } from "./filesStore";
import { windowStore } from "./windowStore";

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

   const unlisten = client.gateway.listen("ready", async (d) => {
      const thisStore = store.getState();
      store.setState({ presences: [] });

      const presence: AppPresence = {
         userId: d.user.id,
         status: d.userSettings.status || "online",
         activities: [],
         activeSessions: [client.gateway.sessionId!],
      };

      thisStore.updatePresence(d.user.id, presence);
      store.setState({ thisPresence: presence });

      if (d.presences) {
         for (const presence of d.presences) {
            thisStore.updatePresence(presence.user.id, convertToAppPresence(presence));
         }
      }

      startCheckingForActivity();
   });

   const unlisten2 = client.gateway.listen("presence_update", (d) => {
      store.getState().updatePresence(d.user.id, convertToAppPresence(d));
   });

   const unlisten3 = client.gateway.listen("session_update", (d) => {
      if (!d.status || !client.user) {
         return;
      }

      const presence = convertToAppPresence({ user: { id: client.user.id }, activeSessions: [], activities: d.activities, status: d.status });
      store.setState((state) => ({ thisPresence: { ...state.thisPresence, status: presence.status, activities: presence.activities } }));
      store.getState().updatePresence(client.user.id, { status: presence.status, activities: presence.activities });
   });

   return () => {
      unlisten();
      unlisten2();
      unlisten3();
   };
}

let activityInterval: number;
function startCheckingForActivity() {
   log("app:presence-store", "default", "start activity checking");
   if (windowStore.getState().environment !== "desktop") {
      return;
   }

   if (activityInterval) {
      window.clearInterval(activityInterval);
   }

   activityInterval = window.setInterval(async () => {
      log("app:presence-store", "default", "check activity");
      try {
         const presence = store.getState().thisPresence;
         const client = clientStore.getState().client;

         if (!client) {
            return;
         }

         const knownApplications = filesStore.getState().knownApplications.applications;
         const openApplications = await window.electronAPI.getOpenApplications();

         const match = openApplications.flatMap((x) => {
            const exeName = x.exePath.split(/[/\\]+/).pop();
            const exeKnown = knownApplications?.find((y) => y.exeName === exeName);
            const nameKnown = knownApplications?.find((y) => y.name === x.windowTitle);
            const cmdLineMatch = exeKnown?.commandLinePatterns.every((y) => x.cmdLine.includes(y));
            console.log(exeName, nameKnown, cmdLineMatch);
            return (nameKnown || exeKnown) && (cmdLineMatch === undefined ? true : cmdLineMatch)
               ? [{ detected: x, known: exeKnown ?? nameKnown }]
               : [];
         })[0];

         if (!match?.detected || !match?.known) {
            // User was previously playing but not anymore
            if (presence.activities.length !== 0) {
               client.gateway.updatePresence({
                  activities: [],
                  status: presence.status,
               });
            }

            return;
         }

         // The detected game is already added
         if (presence.activities[0]?.name === match.known.name) {
            return;
         }

         log("app:presence-store", "default", "new activity", "kid:", match.known.id, "kn:", match.known.name);

         const info = await window.electronAPI.getApplicationInfo(match.detected.exePath, match.detected.processId);
         let iconHash;
         if (info.icon) {
            iconHash = await client.applications.uploadIcon({ icon: info.icon });
         }

         client.gateway.updatePresence({
            activities: [
               {
                  name: match.known.name,
                  type: ActivityType.PLAYING,
                  createdAt: new Date().getTime(),
                  iconUrl: iconHash ? `application-icons/${iconHash}.webp` : undefined,
               },
            ],
            status: presence.status,
         });
      } catch (e) {
         error("app:presence-store", "Error when checking activity:", e);
      }
   }, 5000);
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

export function usePresenceStore() {
   return useStore(store);
}
