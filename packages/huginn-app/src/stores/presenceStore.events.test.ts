import type { APIGetApplicationCatalogResult, GatewayReadyData, GatewaySession, GatewayWebsocketEvents } from "@huginnjs/shared";

import { ActivityType, EventEmitter, GatewayCode } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createTestUser } from "@/test-utils";

import { clientStore } from "./clientStoreState";
import { initPresenceStore, presenceStore } from "./presenceStore";
import { storageStore } from "./storageStore";
import { windowStore } from "./windowStore";

type Events = GatewayWebsocketEvents & { disconnected: number; reset: undefined };

function makeSession(sessionId: string, activityName?: string): GatewaySession {
   return {
      sessionId,
      status: "online",
      clientInfo: { browser: "Huginn Web", os: "test" },
      activities: activityName ? [{ name: activityName, type: ActivityType.PLAYING, createdAt: 1, sessionId }] : [],
   };
}

describe("presence gateway events", () => {
   const user = createTestUser({ id: "self" });
   let gateway: EventEmitter<Events> & { sessionId: string; isAuthenticated: boolean; updatePresence: ReturnType<typeof vi.fn> };
   let cleanup: ReturnType<typeof initPresenceStore>;
   let originalElectronAPI: typeof window.electronAPI;

   function ready(sessions: GatewaySession[]) {
      gateway.emit("ready", { user, sessions, presences: [] } as unknown as GatewayReadyData);
   }

   function selfPresence() {
      return presenceStore.getState().presences.find((presence) => presence.userId === user.id);
   }

   function regionalCatalog(iconHash: string | null): APIGetApplicationCatalogResult {
      return {
         cursor: "1",
         full: true,
         games: [{ id: 7, igdbId: 42, canonicalName: "Shared game", aliases: [], createdAt: "2026-01-01", updatedAt: null }],
         matchers: ["global-icon", iconHash].map((hash, index) => ({
            id: index + 1,
            knownGameId: 7,
            iconHash: hash,
            exeNames: [index === 0 ? "global.exe" : "regional.exe"],
            windowTitles: [],
            platform: "unknown",
            status: "verified",
            verificationMethod: "manual",
            commandLinePatterns: [],
            createdAt: "2026-01-01",
            updatedAt: null,
         })),
         deletedGameIds: [],
         deletedMatcherIds: [],
      };
   }

   function startRegionalActivity(iconHash: string | null, session = makeSession("local")) {
      vi.useFakeTimers();
      windowStore.setState({ environment: "desktop" });
      window.electronAPI = {
         getOpenApplications: vi.fn().mockResolvedValue([{ processId: 1, exePath: "/games/regional.exe", windowTitle: "Shared game" }]),
      } as unknown as typeof window.electronAPI;
      storageStore.getState().setCachedValue("application-catalog", regionalCatalog(iconHash));
      ready([session]);
   }

   beforeEach(() => {
      originalElectronAPI = window.electronAPI;
      windowStore.setState({ environment: "browser" });
      gateway = Object.assign(new EventEmitter<Events>(), {
         sessionId: "local",
         isAuthenticated: true,
         updatePresence: vi.fn(),
      });
      clientStore.setState({ client: { gateway, currentUser: user } as unknown as ReturnType<typeof clientStore.getState>["client"] });
      presenceStore.setState({ presences: [], session: {} as GatewaySession });
      cleanup = initPresenceStore();
   });

   afterEach(() => {
      cleanup?.();
      clientStore.setState({ client: undefined });
      presenceStore.setState({ presences: [], session: {} as GatewaySession });
      windowStore.setState({ environment: "browser" });
      window.electronAPI = originalElectronAPI;
      vi.useRealTimers();
   });

   test("shows an activity already running in another session on ready", () => {
      const local = makeSession("local");
      const remote = makeSession("remote", "Remote game");

      ready([remote, local]);

      expect(selfPresence()?.activities).toEqual(remote.activities);
      expect(presenceStore.getState().session).toEqual(local);
   });

   test.each(["regional-icon", null])("uses the detected matcher's icon (%s) in outgoing presence", async (iconHash) => {
      startRegionalActivity(iconHash);

      await vi.advanceTimersByTimeAsync(5000);

      expect(gateway.updatePresence).toHaveBeenCalledWith({
         status: "online",
         activities: [
            expect.objectContaining({
               applicationId: 2,
               name: "Shared game",
               iconUrl: iconHash ? `/application-icons/7/${iconHash}.webp` : undefined,
            }),
         ],
      });
   });

   test.each(["replacement-icon", null])("publishes an icon change to %s for the same matcher", async (iconHash) => {
      const local = makeSession("local", "Shared game");
      local.activities[0] = { ...local.activities[0], applicationId: 2, iconUrl: "/application-icons/7/regional-icon.webp" };
      startRegionalActivity("regional-icon", local);
      await vi.advanceTimersByTimeAsync(5000);
      expect(gateway.updatePresence).not.toHaveBeenCalled();

      storageStore.getState().setCachedValue("application-catalog", regionalCatalog(iconHash));
      await vi.advanceTimersByTimeAsync(5000);

      expect(gateway.updatePresence).toHaveBeenCalledWith(
         expect.objectContaining({
            activities: [
               expect.objectContaining({
                  applicationId: 2,
                  iconUrl: iconHash ? `/application-icons/7/${iconHash}.webp` : undefined,
               }),
            ],
         }),
      );
   });

   test("merges private activities on session_update while keeping the local session separate", () => {
      const local = { ...makeSession("local", "Local game"), status: "idle" as const };
      const remote = { ...makeSession("remote", "Private remote game"), status: "invisible" as const };
      ready([local, makeSession("remote")]);

      gateway.emit("session_update", [local, remote]);

      expect(selfPresence()?.activities).toEqual([...local.activities, ...remote.activities]);
      expect(selfPresence()?.status).toBe("idle");
      expect(presenceStore.getState().session).toEqual(local);
   });

   test.each(["cleared", "disconnected"])("removes a remote activity when it is %s", (change) => {
      const local = makeSession("local", "Local game");
      ready([local, makeSession("remote", "Remote game")]);
      expect(selfPresence()?.activities).toHaveLength(2);

      gateway.emit("session_update", change === "cleared" ? [local, makeSession("remote")] : [local]);

      expect(selfPresence()?.activities).toEqual(local.activities);
   });

   test("does not send another session's activities back from the local activity detector", async () => {
      vi.useFakeTimers();
      windowStore.setState({ environment: "desktop" });
      window.electronAPI = { getOpenApplications: vi.fn().mockResolvedValue([]) } as unknown as typeof window.electronAPI;
      storageStore.getState().setCachedValue("application-catalog", {
         cursor: "0",
         full: true,
         games: [],
         matchers: [],
         deletedGameIds: [],
         deletedMatcherIds: [],
      });
      ready([makeSession("local"), makeSession("remote", "Remote game")]);

      await vi.advanceTimersByTimeAsync(5000);

      expect(window.electronAPI.getOpenApplications).toHaveBeenCalledOnce();
      expect(selfPresence()?.activities).toHaveLength(1);
      expect(gateway.updatePresence).not.toHaveBeenCalled();
   });

   test.each(["disconnected", "reset"] as const)("restarts activity detection after %s and resume, and stops on cleanup", async (event) => {
      vi.useFakeTimers();
      windowStore.setState({ environment: "desktop" });
      const getOpenApplications = vi.fn().mockResolvedValue([]);
      window.electronAPI = { getOpenApplications } as unknown as typeof window.electronAPI;
      storageStore.getState().setCachedValue("application-catalog", {
         cursor: "0",
         full: true,
         games: [],
         matchers: [],
         deletedGameIds: [],
         deletedMatcherIds: [],
      });
      ready([makeSession("local")]);
      await vi.advanceTimersByTimeAsync(5000);
      expect(getOpenApplications).toHaveBeenCalledOnce();

      if (event === "disconnected") gateway.emit(event, GatewayCode.SESSION_TIMEOUT);
      else gateway.emit(event, undefined);
      await vi.advanceTimersByTimeAsync(5000);
      expect(getOpenApplications).toHaveBeenCalledOnce();

      gateway.emit("resumed", undefined);
      gateway.emit("resumed", undefined);
      await vi.advanceTimersByTimeAsync(5000);
      expect(getOpenApplications).toHaveBeenCalledTimes(2);

      cleanup?.();
      gateway.emit("resumed", undefined);
      await vi.advanceTimersByTimeAsync(5000);
      expect(getOpenApplications).toHaveBeenCalledTimes(2);
   });
});
