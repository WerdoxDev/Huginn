import { testHandler } from "@huginn/backend-shared";
import { ActivityType, GatewayCode, GatewayOperations, type APIPatchCurrentUserJSONBody, type GatewayPayload } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { expectPresenceExactSchema, expectSessionUpdateExactSchema } from "#tests/expect-utils";
import {
   authHeader,
   createTestRelationships,
   createTestUsers,
   getIdentifiedWebSocket,
   getReadyWebSocket,
   multiDone,
   testIsDispatch,
   wsSend,
} from "#tests/utils";

describe("Presence", () => {
   test("should send relationship presences with the websocket ready message", async (done) => {
      const [user, user2] = await createTestUsers(2);
      // FRIEND Relationship between user and user2
      await createTestRelationships(user.id, user2.id, true);

      // Fully connect user2
      const { ws: _ws2, sessionId } = await getReadyWebSocket(user2);

      const { ws } = await getIdentifiedWebSocket(user);

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "ready")) {
            // user2's presence should be sent to user
            expect(data.d.presences).toHaveLength(1);
            expectPresenceExactSchema(data.d.presences[0], {
               user: user2,
               status: "online",
               activeSessionIds: [sessionId],
               activities: [],
               isPartialUser: true,
            });
            done();
         }
      };
   });

   test("should send a presence_update when a related user gets online", async (done) => {
      const [user, user2] = await createTestUsers(2);
      // FRIEND Relationship between user and user2
      await createTestRelationships(user.id, user2.id, true);

      // Fully connect user
      const { ws } = await getReadyWebSocket(user);

      // Listen to presence_update
      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            // user2's presence should be sent to user
            expectPresenceExactSchema(data.d, { user: user2, status: "online", activeSessionIds: [sessionId], activities: [], isPartialUser: true });
            done();
         }
      };

      // Fully connect user2
      const { ws: _ws2, sessionId } = await getReadyWebSocket(user2);
   });

   test(
      "should send an offline presence_update when a related user gets offline",
      async (done) => {
         const [user, user2] = await createTestUsers(2);
         // FRIEND Relationship between user and user2
         await createTestRelationships(user.id, user2.id, true);

         // Fully connect user
         const { ws } = await getReadyWebSocket(user);
         // Fully connect user2
         const { ws: ws2 } = await getReadyWebSocket(user2);

         // Listen to presence_update
         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "presence_update") && data.d.status === "offline") {
               // user2's presence should be sent to user
               expectPresenceExactSchema(data.d, { user: user2, status: "offline", activeSessionIds: [], activities: [] });
               done();
            }
         };

         ws2.close(GatewayCode.INTENTIONAL_CLOSE);
      },
      { timeout: 10000 },
   );

   test("should send an presence_update to both users when they accept each other as friends", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: ws2, sessionId: sessionId2 } = await getReadyWebSocket(user2);
      await createTestRelationships(user.id, user2.id, false);

      const tryDone = multiDone(done, 2);

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            expectPresenceExactSchema(data.d, { user: user2, status: "online", activeSessionIds: [sessionId2], activities: [], isPartialUser: true });
            tryDone();
         }
      };

      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            expectPresenceExactSchema(data.d, { user: user, status: "online", activeSessionIds: [sessionId], activities: [], isPartialUser: true });
            tryDone();
         }
      };

      await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(user2.accessToken), "PUT");
   });

   test(
      "should send an offline presence_update to both users when they remove each other as friends",
      async (done) => {
         const [user, user2] = await createTestUsers(2);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         await createTestRelationships(user.id, user2.id, true);

         const tryDone = multiDone(done, 2);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "presence_update")) {
               expectPresenceExactSchema(data.d, { user: user2, status: "offline", activeSessionIds: [], activities: [] });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "presence_update")) {
               expectPresenceExactSchema(data.d, { user: user, status: "offline", activeSessionIds: [], activities: [] });
               tryDone();
            }
         };

         await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(user2.accessToken), "DELETE");
      },
      { timeout: 10000 },
   );

   test(
      "should respectively add or remove an active session when two sessions of the same user get online/offline",
      async (done) => {
         const [user, user2] = await createTestUsers(2);

         const { ws: ws1, sessionId: sessionId1 } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         await createTestRelationships(user.id, user2.id, true);

         const tryDone = multiDone(done, 3);

         let updateCount = 0;
         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "presence_update")) {
               expectPresenceExactSchema(data.d, {
                  user,
                  status: updateCount === 2 ? "offline" : "online",
                  activeSessionIds: updateCount === 0 ? [sessionId1, sessionId1_2] : updateCount === 1 ? [sessionId1_2] : [],
                  activities: [],
                  isPartialUser: true,
               });
               tryDone();
               updateCount++;
            }
         };

         const { ws: ws1_2, sessionId: sessionId1_2 } = await getReadyWebSocket(user);

         await new Promise((r) => setTimeout(r, 500));
         ws1.close(GatewayCode.INTENTIONAL_CLOSE);
         await new Promise((r) => setTimeout(r, 500));
         ws1_2.close(GatewayCode.INTENTIONAL_CLOSE);
      },
      { timeout: 10000 },
   );

   test("should send a presence_update to other subscribed users when a user is edited", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const { sessionId: sessionId1 } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      await createTestRelationships(user.id, user2.id, true);

      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            expectPresenceExactSchema(data.d, {
               user: { ...user, displayName: "test-edited" },
               status: "online",
               activeSessionIds: [sessionId1],
               activities: [],
            });
            done();
         }
      };

      const edit: APIPatchCurrentUserJSONBody = { displayName: "test-edited" };
      await testHandler("/api/users/@me", authHeader(user.accessToken), "PATCH", edit);
   });

   test("should send a presence_update to other subscribed users when a user changes their presence status", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const { ws: ws1, sessionId: sessionId1 } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      await createTestRelationships(user.id, user2.id, true);

      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            expectPresenceExactSchema(data.d, {
               user,
               status: "dnd",
               activeSessionIds: [sessionId1],
               activities: [],
               isPartialUser: true,
            });
            done();
         }
      };

      const updateData: GatewayPayload = {
         op: GatewayOperations.PRESENCE_UPDATE,
         d: { status: "dnd", activities: [] },
      };
      wsSend(ws1, updateData);
   });

   test("should send a session_update to all sessions when presence is updated", async (done) => {
      const [user] = await createTestUsers(1);

      const { ws: ws1, sessionId: sessionId1 } = await getReadyWebSocket(user);
      const { ws: ws2, sessionId: sessionId2 } = await getReadyWebSocket(user);

      const tryDone = multiDone(done, 2);
      const time = new Date().getTime();

      ws1.onmessage = ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "session_update") && data.d.status !== "online") {
            expectSessionUpdateExactSchema(data.d, {
               status: "dnd",
               activities: [
                  {
                     name: "test",
                     createdAt: time,
                     type: ActivityType.PLAYING,
                     sessionId: sessionId1,
                  },
               ],
               activeSessions: [{ sessionId: sessionId1 }, { sessionId: sessionId2 }],
            });
            tryDone();
         }
      };

      const updateData: GatewayPayload = {
         op: GatewayOperations.PRESENCE_UPDATE,
         d: {
            status: "dnd",
            activities: [{ name: "test", createdAt: time, type: ActivityType.PLAYING }],
         },
      };
      wsSend(ws1, updateData);
   });

   test("should send a presence_update when user activity is updated", async (done) => {
      const [user, user2] = await createTestUsers(2);
      await createTestRelationships(user.id, user2.id, true);

      const { ws: ws1, sessionId: sessionId1 } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);

      const time = new Date().getTime();

      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "presence_update")) {
            expectPresenceExactSchema(data.d, {
               user,
               status: "online",
               activeSessionIds: [sessionId1],
               activities: [{ name: "test", createdAt: time, type: ActivityType.PLAYING, sessionId: sessionId1 }],
               isPartialUser: true,
            });
            done();
         }
      };

      const updateData: GatewayPayload = {
         op: GatewayOperations.PRESENCE_UPDATE,
         d: {
            status: "online",
            activities: [{ name: "test", createdAt: time, type: ActivityType.PLAYING }],
         },
      };
      wsSend(ws1, updateData);
   });
});
