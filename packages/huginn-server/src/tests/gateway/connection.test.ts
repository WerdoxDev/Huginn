import { ChannelType, GatewayCode, type GatewayIdentify, GatewayOperations, type GatewayResume, RelationshipType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { gateway } from "#server";
import {
   expectChannelExactRecipients,
   expectChannelExactSchema,
   expectRelationshipExactSchema,
   expectUserExactSchema,
   expectUserSettingsExactSchema,
} from "#tests/expect-utils";
import {
   createTestChannel,
   createTestRelationships,
   createTestUsers,
   getIdentifiedWebSocket,
   getReadyWebSocket,
   getWebSocket,
   testIsDispatch,
   testIsOpcode,
   wsSend,
} from "#tests/utils";

describe("Connection", () => {
   test("should close the websocket with code 4001 (UNKNOWN_OPCODE) when the sent message has an unknown op code", async () => {
      const { ws } = await getReadyWebSocket();

      wsSend(ws, { op: 99 });
      const closeCode = await new Promise((resolve, reject) => {
         ws.onclose = ({ code }) => resolve(code);
         ws.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.UNKNOWN_OPCODE);
   });

   test("should close the websocket with code 4002 (DECODE_ERROR) when sent message cannot be decoded", async () => {
      const { ws } = await getReadyWebSocket();

      ws.send("[123,]");
      const closeCode = await new Promise((resolve, reject) => {
         ws.onclose = ({ code }) => resolve(code);
         ws.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.DECODE_ERROR);
   });

   test("should close the websocket with code 4003 (NOT_AUTHENTICATED) when the websocket is not authenticated", async () => {
      const ws = await getWebSocket();

      ws.onmessage = ({ data }) => {
         if (testIsOpcode(data, GatewayOperations.HELLO)) {
            wsSend(ws, { op: 99, d: 0 });
         }
      };

      const closeCode = await new Promise((resolve, reject) => {
         ws.onclose = ({ code }) => resolve(code);
         ws.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.NOT_AUTHENTICATED);
   }, 8000); // third arg sets a per-test timeout in ms, replacing your old setTimeout delay

   test("should close the websocket with code 4004 (AUTHENTICATION_FAILED) when the authentication process fails", async () => {
      const ws = await getWebSocket();

      const identifyData: GatewayIdentify = {
         op: GatewayOperations.IDENTIFY,
         d: {
            token: "",
            intents: 0,
            properties: { os: "test", browser: "test", device: "test" },
         },
      };

      ws.onmessage = ({ data }) => {
         if (testIsOpcode(data, GatewayOperations.HELLO)) {
            wsSend(ws, identifyData);
         }
      };

      const closeCode = await new Promise((resolve, reject) => {
         ws.onclose = ({ code }) => resolve(code);
         ws.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.AUTHENTICATION_FAILED);
   });

   test("should close the websocket with code 4005 (ALREADY_AUTHENTICATED) when the websocket is already authenticated", async () => {
      const [user] = await createTestUsers(1);
      const ws = await getWebSocket();

      const identifyData: GatewayIdentify = {
         op: GatewayOperations.IDENTIFY,
         d: {
            token: user.accessToken,
            intents: 0,
            properties: { os: "test", browser: "test", device: "test" },
         },
      };

      ws.onmessage = ({ data }) => {
         if (testIsOpcode(data, GatewayOperations.HELLO)) {
            wsSend(ws, identifyData);
         } else if (testIsDispatch(data, "ready")) {
            // Test
            wsSend(ws, identifyData);
         }
      };

      const closeCode = await new Promise((resolve, reject) => {
         ws.onclose = ({ code }) => resolve(code);
         ws.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.ALREADY_AUTHENTICATED);
   });

   test("should close the websocket with code 4006 (INVALID_SEQ) when the sent sequence number for resuming is invalid", async () => {
      const { ws, user, readyData } = await getReadyWebSocket();
      ws.close();

      for (let i = 0; i < 10; i++) {
         // @ts-ignore
         gateway.sendToTopic(user.id.toString(), { op: GatewayOperations.DISPATCH, s: 0, d: i });
      }

      const ws2 = await getWebSocket();

      const resumeData: GatewayResume = {
         op: GatewayOperations.RESUME,
         d: { sessionId: readyData.sessionId, token: user.accessToken, seq: 99 },
      };

      ws2.onmessage = (event) => {
         if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
            wsSend(ws2, resumeData);
         }
      };

      const closeCode = await new Promise((resolve, reject) => {
         ws2.onclose = ({ code }) => resolve(code);
         ws2.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.INVALID_SEQ);
   });

   test(
      "should close the websocket with code 4006 (INVALID_SEQ) when the message queue cannot cover all missed messages",
      async () => {
         const { ws, user, readyData } = await getReadyWebSocket();
         ws.close();

         for (let i = 0; i < 40; i++) {
            gateway.sendToTopic(user.id.toString(), {
               op: GatewayOperations.DISPATCH,
               s: 0,
               t: "typing_start",
               d: { channelId: "123", userId: "123", timestamp: i },
            });
         }

         const ws2 = await getWebSocket();

         const resumeData: GatewayResume = {
            op: GatewayOperations.RESUME,
            d: { sessionId: readyData.sessionId, token: user.accessToken, seq: 0 },
         };

         ws2.onmessage = (event) => {
            if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
               wsSend(ws2, resumeData);
            }
            expect(testIsDispatch(event.data, "resumed")).toBe(false);
         };

         const result = await new Promise((resolve, reject) => {
            ws2.onclose = ({ code }) => resolve(code);
            ws2.onerror = (err) => reject(err);
         });

         expect(result).toBe(GatewayCode.INVALID_SEQ);
      },
      { timeout: 10000 },
   );

   test("should close the websocket with code 4009 (INVALID_SESSION) when trying to resume a non existing session", async () => {
      const { ws, user } = await getReadyWebSocket();
      ws.close();

      const ws2 = await getWebSocket();

      const resumeData: GatewayResume = {
         op: GatewayOperations.RESUME,
         d: { seq: 0, sessionId: "invalid", token: user.accessToken },
      };

      ws2.onmessage = (event) => {
         if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
            wsSend(ws2, resumeData);
         }
      };

      const closeCode = await new Promise((resolve, reject) => {
         ws2.onclose = ({ code }) => resolve(code);
         ws2.onerror = (err) => reject(err);
      });

      expect(closeCode).toBe(GatewayCode.INVALID_SESSION);
   });

   test("should resume the websocket when it is disconnected and has not received some messages", async (done) => {
      const { ws, readyData, user } = await getReadyWebSocket();
      ws.close();

      for (let i = 0; i < 10; i++) {
         // @ts-ignore
         gateway.sendToTopic(user.id.toString(), {
            op: GatewayOperations.DISPATCH,
            s: 0,
            t: "typing_start",
            d: { channelId: "123", userId: "123", timestamp: i },
         });
      }

      const ws2 = await getWebSocket();

      const resumeData: GatewayResume = {
         op: GatewayOperations.RESUME,
         d: { seq: 0, sessionId: readyData.sessionId, token: user.accessToken },
      };

      let received = 0;
      ws2.onmessage = (event) => {
         if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
            wsSend(ws2, resumeData);
         }

         if (testIsDispatch(event.data, "resumed")) {
            done();
            return;
         }

         const data = JSON.parse(event.data);
         if (testIsOpcode(data, GatewayOperations.DISPATCH)) {
            // @ts-ignore
            if (data.t === "typing_start") {
               expect((data as { d: { channelId: string; userId: string; timestamp: number } }).d).toEqual({
                  channelId: "123",
                  userId: "123",
                  timestamp: received,
               });
               received++;
            }
         }
      };
   });

   test("should send ready to client when identifying is successful", async (done) => {
      const [user, user2] = await createTestUsers(2);
      await createTestRelationships(user.id, user2.id, true);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const { ws } = await getIdentifiedWebSocket(user);

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "ready")) {
            expect(data.d.privateChannels).toHaveLength(1);
            expect(data.d.relationships).toHaveLength(1);
            expectChannelExactSchema(data.d.privateChannels[0], { type: ChannelType.DM, id: channel.id });
            expectChannelExactRecipients(data.d.privateChannels[0], [user2]);
            expectRelationshipExactSchema(data.d.relationships[0], { type: RelationshipType.FRIEND, user: user2 });
            expectUserExactSchema(data.d.user, user);
            expectUserSettingsExactSchema(data.d.userSettings, { status: "online", pinnedChannels: [], favoriteGifs: [] });
            done();
         }
      };
   });
});
