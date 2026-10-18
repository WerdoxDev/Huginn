import { testHandler } from "@huginn/backend-shared";
import {
   ActivityType,
   GatewayCode,
   GatewayOperations,
   type GatewaySession,
   type GatewayUpdatePresenceData,
   type GatewayWebsocketEvents,
} from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { expectPresenceExactSchema, expectSessionUpdateExactSchema } from "#tests/expect-utils";
import { authHeader, createTestRelationships, createTestUsers, getReadyWebSocket, testIsDispatch, wsSend } from "#tests/utils";

function waitForDispatch<Event extends keyof GatewayWebsocketEvents>(
   ws: WebSocket,
   eventType: Event,
   matches: (data: GatewayWebsocketEvents[Event]) => boolean = () => true,
): Promise<GatewayWebsocketEvents[Event]> {
   return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
         cleanup();
         reject(new Error(`Timed out waiting for ${eventType}`));
      }, 3000);

      function cleanup() {
         clearTimeout(timeout);
         ws.removeEventListener("message", onMessage);
         ws.removeEventListener("close", onClose);
      }

      function onMessage(event: MessageEvent) {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, eventType)) {
            const payload = data.d as GatewayWebsocketEvents[Event];
            if (matches(payload)) {
               cleanup();
               resolve(payload);
            }
         }
      }

      function onClose() {
         cleanup();
         reject(new Error(`WebSocket closed while waiting for ${eventType}`));
      }

      ws.addEventListener("message", onMessage);
      ws.addEventListener("close", onClose);
   });
}

function updatePresence(ws: WebSocket, data: GatewayUpdatePresenceData) {
   wsSend(ws, { op: GatewayOperations.PRESENCE_UPDATE, d: data });
}

function expectedSession(sessionId: string, options: Partial<Omit<GatewaySession, "sessionId">> = {}): GatewaySession {
   return { sessionId, status: "online", activities: [], clientInfo: { browser: "Huginn Web", os: "test" }, ...options };
}

describe("Presence", () => {
   test("sends relationship presences and the user's sessions with ready", async () => {
      const [user, friend] = await createTestUsers(2);
      await createTestRelationships(user.id, friend.id, true);
      await getReadyWebSocket(friend);

      const { readyData, sessionId } = await getReadyWebSocket(user);

      expect(readyData.presences).toHaveLength(1);
      expectPresenceExactSchema(readyData.presences[0], {
         user: friend,
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
         isPartialUser: true,
      });
      expectSessionUpdateExactSchema(readyData.sessions, [expectedSession(sessionId)]);
   });

   test("sends presence_update when a related user connects", async () => {
      const [user, friend] = await createTestUsers(2);
      await createTestRelationships(user.id, friend.id, true);
      const { ws } = await getReadyWebSocket(user);
      const presence = waitForDispatch(ws, "presence_update");

      await getReadyWebSocket(friend);

      expectPresenceExactSchema(await presence, {
         user: friend,
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
         isPartialUser: true,
      });
   });

   test("sends offline presence_update when a related user's last session disconnects", async () => {
      const [user, friend] = await createTestUsers(2);
      await createTestRelationships(user.id, friend.id, true);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      const { ws } = await getReadyWebSocket(user);
      const presence = waitForDispatch(ws, "presence_update", (data) => data.status === "offline");

      friendWs.close(GatewayCode.INTENTIONAL_CLOSE);

      expectPresenceExactSchema(await presence, { user: friend, status: "offline", clientStatus: {}, activities: [] });
   });

   test("sends presence_update to both users when they accept each other as friends", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws } = await getReadyWebSocket(user);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, false);
      const userPresence = waitForDispatch(ws, "presence_update");
      const friendPresence = waitForDispatch(friendWs, "presence_update");

      await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(friend.accessToken), "PUT");

      expectPresenceExactSchema(await userPresence, {
         user: friend,
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
         isPartialUser: true,
      });
      expectPresenceExactSchema(await friendPresence, {
         user,
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
         isPartialUser: true,
      });
   });

   test("sends offline presence_update to both users when they remove each other as friends", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws } = await getReadyWebSocket(user);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const userPresence = waitForDispatch(ws, "presence_update", (data) => data.status === "offline");
      const friendPresence = waitForDispatch(friendWs, "presence_update", (data) => data.status === "offline");

      await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(friend.accessToken), "DELETE");

      expectPresenceExactSchema(await userPresence, { user: friend, status: "offline", clientStatus: {}, activities: [] });
      expectPresenceExactSchema(await friendPresence, { user, status: "offline", clientStatus: {}, activities: [] });
   });

   test("updates clientStatus and session records as a user's platforms connect and disconnect", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws: desktopWs, sessionId: desktopId } = await getReadyWebSocket(user, { client: "Huginn Client", os: "linux" });
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const connectedPresence = waitForDispatch(friendWs, "presence_update");
      const connectedSessions = waitForDispatch(desktopWs, "session_update", (sessions) => sessions.length === 2);

      const { ws: mobileWs, sessionId: mobileId, readyData } = await getReadyWebSocket(user, { client: "Huginn Mobile", os: "android" });
      const sessions = [
         expectedSession(desktopId, { clientInfo: { browser: "Huginn Client", os: "linux" } }),
         expectedSession(mobileId, { clientInfo: { browser: "Huginn Mobile", os: "android" } }),
      ];
      expectSessionUpdateExactSchema(readyData.sessions, sessions);
      expectSessionUpdateExactSchema(await connectedSessions, sessions);
      expectPresenceExactSchema(await connectedPresence, {
         user,
         status: "online",
         clientStatus: { desktop: "online", mobile: "online" },
         activities: [],
         isPartialUser: true,
      });

      const disconnectedPresence = waitForDispatch(friendWs, "presence_update");
      const remainingSessions = waitForDispatch(mobileWs, "session_update", (sessions) => sessions.length === 1);
      desktopWs.close(GatewayCode.INTENTIONAL_CLOSE);
      expectSessionUpdateExactSchema(await remainingSessions, [sessions[1]]);
      expectPresenceExactSchema(await disconnectedPresence, {
         user,
         status: "online",
         clientStatus: { mobile: "online" },
         activities: [],
         isPartialUser: true,
      });

      const offlinePresence = waitForDispatch(friendWs, "presence_update", (data) => data.status === "offline");
      mobileWs.close(GatewayCode.INTENTIONAL_CLOSE);
      expectPresenceExactSchema(await offlinePresence, { user, status: "offline", clientStatus: {}, activities: [] });
   });

   test("sends edited profile fields to presence subscribers", async () => {
      const [user, friend] = await createTestUsers(2);
      await getReadyWebSocket(user);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const presence = waitForDispatch(friendWs, "presence_update");

      await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", { displayName: "test-edited" });

      expectPresenceExactSchema(await presence, {
         user: { ...user, displayName: "test-edited" },
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
      });
   });

   test("sends presence_update when a user changes their status", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws } = await getReadyWebSocket(user);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const presence = waitForDispatch(friendWs, "presence_update");

      updatePresence(ws, { status: "dnd", activities: [] });

      expectPresenceExactSchema(await presence, {
         user,
         status: "dnd",
         clientStatus: { web: "dnd" },
         activities: [],
         isPartialUser: true,
      });
   });

   test("sends per-session status and activities to all sessions", async () => {
      const [user] = await createTestUsers(1);
      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: secondWs, sessionId: secondId } = await getReadyWebSocket(user);
      const firstUpdate = waitForDispatch(ws, "session_update", (sessions) => sessions.some((session) => session.status === "dnd"));
      const secondUpdate = waitForDispatch(secondWs, "session_update", (sessions) => sessions.some((session) => session.status === "dnd"));
      const activity = { name: "test", createdAt: Date.now(), type: ActivityType.PLAYING };

      updatePresence(ws, { status: "dnd", activities: [activity] });

      const expected = [expectedSession(sessionId, { status: "dnd", activities: [{ ...activity, sessionId }] }), expectedSession(secondId)];
      expectSessionUpdateExactSchema(await firstUpdate, expected);
      expectSessionUpdateExactSchema(await secondUpdate, expected);
   });

   test("applies overallStatus to every session while keeping activities on the sending session", async () => {
      const [user] = await createTestUsers(1);
      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: secondWs, sessionId: secondId } = await getReadyWebSocket(user);
      const firstUpdate = waitForDispatch(ws, "session_update", (sessions) => sessions.every((session) => session.status === "idle"));
      const secondUpdate = waitForDispatch(secondWs, "session_update", (sessions) => sessions.every((session) => session.status === "idle"));
      const activity = { name: "test", createdAt: Date.now(), type: ActivityType.PLAYING };

      updatePresence(ws, { status: "idle", activities: [activity], overallStatus: true });

      const expected = [
         expectedSession(sessionId, { status: "idle", activities: [{ ...activity, sessionId }] }),
         expectedSession(secondId, { status: "idle" }),
      ];
      expectSessionUpdateExactSchema(await firstUpdate, expected);
      expectSessionUpdateExactSchema(await secondUpdate, expected);
   });

   test("aggregates status by priority across platforms and sessions on the same platform", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws } = await getReadyWebSocket(user);
      const { ws: secondWs } = await getReadyWebSocket(user);
      const { ws: mobileWs } = await getReadyWebSocket(user, { client: "Huginn Mobile" });
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);

      const firstUpdate = waitForDispatch(ws, "session_update", (sessions) => sessions[0].status === "idle");
      updatePresence(ws, { status: "idle", activities: [] });
      await firstUpdate;
      const dndPresence = waitForDispatch(friendWs, "presence_update", (data) => data.clientStatus.mobile === "dnd");
      updatePresence(mobileWs, { status: "dnd", activities: [] });
      expectPresenceExactSchema(await dndPresence, {
         user,
         status: "online",
         clientStatus: { web: "online", mobile: "dnd" },
         activities: [],
         isPartialUser: true,
      });

      const idlePresence = waitForDispatch(friendWs, "presence_update", (data) => data.clientStatus.web === "idle");
      updatePresence(secondWs, { status: "idle", activities: [] });
      expectPresenceExactSchema(await idlePresence, {
         user,
         status: "dnd",
         clientStatus: { web: "idle", mobile: "dnd" },
         activities: [],
         isPartialUser: true,
      });

      const finalPresence = waitForDispatch(friendWs, "presence_update", (data) => data.status === "idle");
      updatePresence(mobileWs, { status: "invisible", activities: [] });
      expectPresenceExactSchema(await finalPresence, {
         user,
         status: "idle",
         clientStatus: { web: "idle" },
         activities: [],
         isPartialUser: true,
      });
   });

   test("merges activities from visible sessions and removes them when cleared", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: mobileWs, sessionId: mobileId } = await getReadyWebSocket(user, { client: "Huginn Mobile" });
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const firstActivity = { name: "desktop-game", createdAt: Date.now(), type: ActivityType.PLAYING };
      const mobileActivity = { name: "mobile-game", createdAt: Date.now(), type: ActivityType.PLAYING };
      const firstPresence = waitForDispatch(friendWs, "presence_update", (data) => data.activities.length === 1);
      updatePresence(ws, { status: "online", activities: [firstActivity] });
      await firstPresence;

      const mergedPresence = waitForDispatch(friendWs, "presence_update", (data) => data.activities.length === 2);
      updatePresence(mobileWs, { status: "online", activities: [mobileActivity] });
      expectPresenceExactSchema(await mergedPresence, {
         user,
         status: "online",
         clientStatus: { web: "online", mobile: "online" },
         activities: [
            { ...firstActivity, sessionId },
            { ...mobileActivity, sessionId: mobileId },
         ],
         isPartialUser: true,
      });

      const clearedPresence = waitForDispatch(friendWs, "presence_update", (data) => data.activities.length === 1);
      updatePresence(ws, { status: "online", activities: [] });
      expectPresenceExactSchema(await clearedPresence, {
         user,
         status: "online",
         clientStatus: { web: "online", mobile: "online" },
         activities: [{ ...mobileActivity, sessionId: mobileId }],
         isPartialUser: true,
      });
   });

   test("exposes invisible sessions as offline to subscribers but retains their private session data", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const presence = waitForDispatch(friendWs, "presence_update", (data) => data.status === "offline");
      const sessions = waitForDispatch(ws, "session_update", (data) => data[0].status === "invisible");
      const activity = { name: "private-game", createdAt: Date.now(), type: ActivityType.PLAYING };

      updatePresence(ws, { status: "invisible", activities: [activity] });

      expectPresenceExactSchema(await presence, { user, status: "offline", clientStatus: {}, activities: [] });
      expectSessionUpdateExactSchema(await sessions, [expectedSession(sessionId, { status: "invisible", activities: [{ ...activity, sessionId }] })]);

      const { readyData } = await getReadyWebSocket(friend);
      expect(readyData.presences).toHaveLength(1);
      expectPresenceExactSchema(readyData.presences[0], { user, status: "offline", clientStatus: {}, activities: [] });
   });

   test("does not broadcast invisible activity changes or unchanged aggregates", async () => {
      const [user, friend] = await createTestUsers(2);
      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: mobileWs } = await getReadyWebSocket(user, { client: "Huginn Mobile" });
      const { ws: friendWs } = await getReadyWebSocket(friend);
      await createTestRelationships(user.id, friend.id, true);
      const hiddenPresence = waitForDispatch(friendWs, "presence_update", (data) => !data.clientStatus.web);
      updatePresence(ws, { status: "invisible", activities: [] });
      await hiddenPresence;

      const updates: GatewayWebsocketEvents["presence_update"][] = [];
      friendWs.addEventListener("message", (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) updates.push(data.d);
      });
      const activity = { name: "private-game", createdAt: Date.now(), type: ActivityType.PLAYING };
      const privateUpdate = waitForDispatch(ws, "session_update", (sessions) => sessions[0].activities.length === 1);
      updatePresence(ws, { status: "invisible", activities: [activity] });
      expectSessionUpdateExactSchema((await privateUpdate).slice(0, 1), [
         expectedSession(sessionId, { status: "invisible", activities: [{ ...activity, sessionId }] }),
      ]);

      const unchangedUpdate = waitForDispatch(mobileWs, "session_update", (sessions) => sessions[0].activities.length === 1);
      updatePresence(mobileWs, { status: "online", activities: [] });
      await unchangedUpdate;

      // A later visible update provides a boundary for checking earlier broadcasts without sleeping.
      const visibleUpdate = waitForDispatch(friendWs, "presence_update", (data) => data.status === "idle");
      updatePresence(mobileWs, { status: "idle", activities: [] });
      expectPresenceExactSchema(await visibleUpdate, {
         user,
         status: "idle",
         clientStatus: { mobile: "idle" },
         activities: [],
         isPartialUser: true,
      });
      expect(updates).toHaveLength(1);
   });

   test.each(["Custom Client", undefined])("treats client %s as a web session", async (client) => {
      const [user, friend] = await createTestUsers(2);
      await createTestRelationships(user.id, friend.id, true);
      const { ws } = await getReadyWebSocket(friend);
      const presence = waitForDispatch(ws, "presence_update");

      const { readyData, sessionId } = await getReadyWebSocket(user, { client });

      expectSessionUpdateExactSchema(readyData.sessions, [expectedSession(sessionId, { clientInfo: { browser: client ?? "Huginn Web", os: "test" } })]);
      expectPresenceExactSchema(await presence, {
         user,
         status: "online",
         clientStatus: { web: "online" },
         activities: [],
         isPartialUser: true,
      });
   });
});
