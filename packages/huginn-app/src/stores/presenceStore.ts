import {
   ActivityType,
   CDNRoutes,
   cleanApplicationTitle,
   error,
   type APIApplicationMatcher,
   type APIGetApplicationCatalogResult,
   type APIKnownGame,
   type GatewaySession,
   type Snowflake,
} from "@huginnjs/shared";
import { getHostId } from "@lib/child-window";
import { convertToAppPresence, convertToAppSession } from "@lib/utils";
import { produce } from "immer";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

import type { ApplicationInfo, ApplicationPreferenceKey, AppPresence, CustomApplication } from "@/types";

import { clientStore } from "./clientStoreState";
import { storageStore } from "./storageStore";
import { windowStore } from "./windowStore";

const initialStore = () => ({
   presences: [] as AppPresence[],
   session: {} as GatewaySession,
   activeApplication: undefined as { key: ApplicationPreferenceKey; hwnd?: number } | undefined,
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

      // Display activities from every owned session, but keep the local session separate for outgoing updates.
      const presence = convertToAppPresence({
         user: { id: d.user.id },
         activities: d.sessions.flatMap((s) => s.activities),
         status: session.status,
         clientStatus: {},
      });

      store.setState({ session: convertToAppSession(session) });
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

      const presence = convertToAppPresence({
         user: { id: client.currentUser.id },
         activities: d.flatMap((s) => s.activities),
         status: session.status,
         clientStatus: {},
      });

      store.setState({ session: convertToAppSession(session) });
      store.getState().updatePresence(client.currentUser.id, presence);
   });

   const unlistenPreferences = storageStore.subscribe(
      (state) => state.cache["application-preferences"],
      () => syncOverlay(),
   );

   const unlisten4 = client.gateway.listen("disconnected", stopCheckingForActivity);
   const unlisten5 = client.gateway.listen("resumed", startCheckingForActivity);
   const unlisten6 = client.gateway.listen("reset", stopCheckingForActivity);

   return () => {
      unlisten();
      unlisten2();
      unlisten3();
      unlisten4();
      unlisten5();
      unlisten6();
      unlistenPreferences();
      stopCheckingForActivity();
   };
}

let overlayHwnd: number | undefined;

function syncOverlay() {
   const active = store.getState().activeApplication;
   const preferences = storageStore.getState().getCachedValue("application-preferences");
   const hwnd = active && (preferences?.[active.key]?.overlayEnabled ?? true) ? active.hwnd : undefined;

   if (hwnd === overlayHwnd) return;
   if (hwnd) window.electronAPI.openOverlay(hwnd, getHostId());
   else window.electronAPI.closeOverlay();
   overlayHwnd = hwnd;
}

function setActiveApplication(activeApplication: ReturnType<typeof initialStore>["activeApplication"]) {
   const previous = store.getState().activeApplication;
   if (previous?.key !== activeApplication?.key || previous?.hwnd !== activeApplication?.hwnd) {
      store.setState({ activeApplication });
   }
   syncOverlay();
}

let activityInterval: number | undefined;
let activityGeneration = 0;
function startCheckingForActivity() {
   if (windowStore.getState().environment !== "desktop") {
      return;
   }

   stopCheckingForActivity();

   const generation = activityGeneration;
   activityInterval = window.setInterval(async () => {
      try {
         const session = store.getState().session;
         const client = clientStore.getState().client;

         if (!client?.gateway.isAuthenticated || !client.gateway.sessionId) return;

         const knownApplications = storageStore.getState().getCachedValue("application-catalog");
         const customApplications = storageStore.getState().getCachedValue("custom-applications");
         const openApplications = await window.electronAPI.getOpenApplications();
         if (generation !== activityGeneration) return;

         const knownMatch = detectKnownApplication(openApplications, knownApplications, windowStore.getState().platform);
         const customMatch = detectCustomApplication(openApplications, customApplications);

         const ourActivities = session.activities.filter((x) => x.sessionId === client.gateway.sessionId);

         if (!knownMatch && !customMatch) {
            setActiveApplication(undefined);
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
            known?: { matcher: APIApplicationMatcher; game: APIKnownGame };
         } = knownMatch ?? customMatch;

         setActiveApplication({
            key: match.known ? `known:${match.known.game.id}` : `custom:${match.custom!.exePath}`,
            hwnd: match.detected.hwnd,
         });

         const knownIconUrl = match.known?.matcher.iconHash
            ? CDNRoutes.applicationIcon(match.known.game.id, match.known.matcher.iconHash)
            : undefined;

         // Skip if we already have the activity
         if (ourActivities[0]) {
            if (match.known) {
               if (
                  match.known.matcher.id === ourActivities[0].applicationId &&
                  (knownIconUrl ? ourActivities[0].iconUrl?.endsWith(knownIconUrl) : !ourActivities[0].iconUrl)
               ) {
                  return;
               }
            } else if (match.custom) {
               if (match.custom.title === ourActivities[0].name) {
                  return;
               }
            }
         }

         let iconUrl = knownIconUrl;
         if (match.custom && match.detected.icon && client.currentUser) {
            const iconHash = await client.applications.uploadIcon({ icon: match.detected.icon });
            iconUrl = CDNRoutes.applicationIcon(client.currentUser.id, iconHash);
         }

         client.gateway.updatePresence({
            activities: [
               {
                  name: match.known?.game.canonicalName ?? match.custom?.title ?? "Unknown",
                  type: ActivityType.PLAYING,
                  createdAt: new Date().getTime(),
                  startedAt: new Date().getTime(),
                  iconUrl,
                  applicationId: match.known?.matcher.id,
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
   activityGeneration++;
   setActiveApplication(undefined);
   if (activityInterval) {
      clearInterval(activityInterval);
      activityInterval = undefined;
   }
}

export function detectKnownApplication(applications: ApplicationInfo[], catalog: APIGetApplicationCatalogResult, platform?: string) {
   const games = new Map(catalog.games.map((game) => [game.id, game]));
   let bestMatch:
      | {
           detected: ApplicationInfo;
           known: { matcher: APIApplicationMatcher; game: APIKnownGame };
           score: number;
           matcherTitleMatches: boolean;
        }
      | undefined;

   for (const application of applications) {
      const exePathParts = application.exePath?.split(/[/\\]+/).filter(Boolean);
      const exeNames = exePathParts ? [exePathParts.at(-1), exePathParts.length > 1 ? exePathParts.slice(-2).join("/") : undefined] : [];
      const windowTitle = cleanApplicationTitle(application.windowTitle);

      for (const matcher of catalog.matchers) {
         if (matcher.platform !== "unknown" && platform && matcher.platform !== platform) continue;

         const game = games.get(matcher.knownGameId);
         if (!game) continue;

         const exeMatchScore = matcher.exeNames.reduce((score, matcherExeName) => {
            const normalizedMatcherExeName = matcherExeName.replaceAll("\\", "/");
            const candidateIndex = exeNames.indexOf(normalizedMatcherExeName);
            return Math.max(score, candidateIndex === 1 ? 2 : candidateIndex === 0 ? 1 : 0);
         }, 0);
         const exeMatches = exeMatchScore > 0;
         const matcherTitleMatches = matcher.windowTitles.some((title) => cleanApplicationTitle(title) === windowTitle);
         const knownTitles = [game.canonicalName, ...game.aliases].map(cleanApplicationTitle);
         const titleMatches = matcherTitleMatches || knownTitles.includes(windowTitle);
         const commandLineMatches = matcher.commandLinePatterns.every((pattern) => application.cmdLine?.includes(pattern) === true);

         if ((exeMatches || titleMatches) && commandLineMatches) {
            const score = matcher.commandLinePatterns.length + exeMatchScore + Number(titleMatches) + Number(matcher.platform === platform);

            // Prefer a variant's own title over shared game aliases when evidence is otherwise equal.
            if (!bestMatch || score > bestMatch.score || (score === bestMatch.score && matcherTitleMatches && !bestMatch.matcherTitleMatches)) {
               bestMatch = { detected: application, known: { matcher, game }, score, matcherTitleMatches };
            }
         }
      }
   }

   if (bestMatch) {
      return { detected: bestMatch.detected, known: bestMatch.known };
   }
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
