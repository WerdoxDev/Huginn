import { ActivityType, error, log, type APIKnownApplication, type Snowflake } from "@huginn/shared";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";
import { clientStore } from "./clientStore";
import type { AppPresence, CustomApplication } from "@/types";
import { convertToAppPresence } from "@lib/utils";
import { filesStore } from "./filesStore";
import { windowStore } from "./windowStore";
import type { ProcessInfo } from "native-addon";

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
         const customApplications = filesStore.getState().customApplications;
         const openApplications = await window.electronAPI.getOpenApplications();

         const knownMatch = detectKnownApplication(openApplications, knownApplications);
         const customMatch = detectCustomApplication(openApplications, customApplications);

         if (!knownMatch && !customMatch) {
            // Nothing detected -> clear presence if it was set before
            if (presence.activities.length !== 0) {
               client.gateway.updatePresence({
                  activities: [],
                  status: presence.status,
               });
            }
            return;
         }

         const match: { detected: ProcessInfo; custom?: CustomApplication; known?: APIKnownApplication } = knownMatch ?? customMatch;

         // Skip if we already have the activity
         if (presence.activities[0]) {
            if (match.known) {
               if (match.known.id === presence.activities[0].applicationId) {
                  return;
               }
            } else if (match.custom) {
               if (match.custom.title === presence.activities[0].name) {
                  return;
               }
            }
         }

         log("app:presence-store", "default", "new activity", "kid:", match.known?.id, "kn:", match.known?.names, "ctit:", match.custom?.title, "cexe:", match.custom?.exePath);

         const info = await window.electronAPI.getApplicationInfo(match.detected.exePath, match.detected.processId);
         let iconHash;
         if (info.icon) {
            iconHash = await client.applications.uploadIcon({ icon: info.icon });
         }

         client.gateway.updatePresence({
            activities: [
               {
                  name: match.known?.names[0] ?? match.custom?.title ?? "Unknown",
                  type: ActivityType.PLAYING,
                  createdAt: new Date().getTime(),
                  iconUrl: iconHash ? `application-icons/${iconHash}.webp` : undefined,
                  applicationId: match.known?.id,
               },
            ],
            status: presence.status,
         });
      } catch (e) {
         error("app:presence-store", "Error when checking activity:", e);
      }
   }, 5000);
}

function detectKnownApplication(applications: ProcessInfo[], knownApplications: APIKnownApplication[]) {
   const match = applications.flatMap((x) => {
      const exeName = x.exePath.split(/[/\\]+/).pop();
      const exeKnown = knownApplications?.find((y) => y.exeName === exeName);
      const nameKnown = knownApplications?.find((y) => y.names.includes(x.windowTitle));
      const cmdLineMatch = exeKnown?.commandLinePatterns.every((y) => x.cmdLine.includes(y));
      return (nameKnown || exeKnown) && (cmdLineMatch === undefined ? true : cmdLineMatch) ? [{ detected: x, known: exeKnown! ?? nameKnown! }] : [];
   })[0];

   return match;
}

function detectCustomApplication(applications: ProcessInfo[], customApplications: CustomApplication[]) {
   const match = applications.flatMap((x) => {
      const found = customApplications?.find((y) => y.exePath === x.exePath);
      return found ? [{ detected: x, custom: found }] : [];
   })[0];

   return match;
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
