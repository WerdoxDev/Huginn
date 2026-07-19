import { ActivityType, error, type APIKnownApplication, type GatewaySession, type Snowflake } from "@huginn/shared";
import { convertToAppPresence } from "@lib/utils";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { ApplicationInfo, AppPresence, CustomApplication } from "@/types";

import { clientStore } from "./clientStore";
import { storageStore } from "./storageStore";
import { windowStore } from "./windowStore";

const initialStore = () => ({
   presences: [] as AppPresence[],
   session: {} as GatewaySession,
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

export function initPresenceStore() {
   const client = clientStore.getState().client;
   if (!client) return;

   const unlisten = client.gateway.listen("ready", async (d) => {
      const thisStore = store.getState();
      store.setState({ presences: [] });

      const session = d.sessions.find((x) => x.sessionId === client.gateway.sessionId);
      if (!session) return;

      const presence: AppPresence = {
         userId: d.user.id,
         status: session.status,
         activities: session?.activities,
         clientStatus: {},
      };

      store.setState({ session: session });
      thisStore.updatePresence(d.user.id, presence);

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
      const session = d.find((x) => x.sessionId === client.gateway.sessionId);

      if (!client.currentUser || !session) return;

      const presence: AppPresence = {
         userId: client.currentUser.id,
         activities: session.activities,
         status: session.status,
         clientStatus: {},
      };

      store.setState({ session: session });
      store.getState().updatePresence(client.currentUser.id, presence);
   });

   const unlisten4 = client.gateway.listen("disconnected", () => {
      stopCheckingForActivity();
   });

   return () => {
      unlisten();
      unlisten2();
      unlisten3();
      unlisten4();
   };
}

let activityInterval: number | undefined;
function startCheckingForActivity() {
   if (windowStore.getState().environment !== "desktop") {
      return;
   }

   stopCheckingForActivity();

   activityInterval = window.setInterval(async () => {
      try {
         const session = store.getState().session;
         const client = clientStore.getState().client;

         if (!client?.gateway.isAuthenticated || !client.gateway.sessionId) return;

         const knownApplications = storageStore.getState().getCachedValue("known-applications").applications;
         const customApplications = storageStore.getState().getCachedValue("custom-applications");
         const openApplications = await window.electronAPI.getOpenApplications();

         const knownMatch = detectKnownApplication(openApplications, knownApplications);
         const customMatch = detectCustomApplication(openApplications, customApplications);

         const ourActivities = session.activities.filter((x) => x.sessionId === client.gateway.sessionId);

         if (!knownMatch && !customMatch) {
            // Nothing detected -> clear presence if it was set before
            if (ourActivities.length !== 0) {
               client.gateway.updatePresence({
                  activities: [],
                  status: session.status,
               });
            }
            return;
         }

         const match: {
            detected: ApplicationInfo;
            custom?: CustomApplication;
            known?: APIKnownApplication;
         } = knownMatch ?? customMatch;

         // Skip if we already have the activity
         if (ourActivities[0]) {
            if (match.known) {
               if (match.known.id === ourActivities[0].applicationId) {
                  return;
               }
            } else if (match.custom) {
               if (match.custom.title === ourActivities[0].name) {
                  return;
               }
            }
         }

         let iconHash;
         if (match.detected.icon) {
            iconHash = await client.applications.uploadIcon({ icon: match.detected.icon });
         }

         client.gateway.updatePresence({
            activities: [
               {
                  name: match.known?.names[0] ?? match.custom?.title ?? "Unknown",
                  type: ActivityType.PLAYING,
                  createdAt: new Date().getTime(),
                  startedAt: new Date().getTime(),
                  iconUrl: iconHash ? `application-icons/${iconHash}.webp` : undefined,
                  applicationId: match.known?.id,
               },
            ],
            status: session.status,
         });
      } catch (e) {
         error("app:presence-store", "Error when checking activity:", e);
      }
   }, 5000);
}

function stopCheckingForActivity() {
   if (activityInterval) {
      clearInterval(activityInterval);
      activityInterval = undefined;
   }
}

function detectKnownApplication(applications: ApplicationInfo[], knownApplications: APIKnownApplication[]) {
   const match = applications.flatMap((x) => {
      const exeName = x.exePath.split(/[/\\]+/).pop();
      const exeKnown = knownApplications?.find((y) => y.exeName === exeName);
      const nameKnown = knownApplications?.find((y) => y.names.includes(x.windowTitle));
      const cmdLineMatch = exeKnown?.commandLinePatterns.every((y) => x.cmdLine.includes(y));
      return (nameKnown || exeKnown) && (cmdLineMatch === undefined ? true : cmdLineMatch) ? [{ detected: x, known: exeKnown! ?? nameKnown! }] : [];
   })[0];

   return match;
}

function detectCustomApplication(applications: ApplicationInfo[], customApplications: CustomApplication[]) {
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
