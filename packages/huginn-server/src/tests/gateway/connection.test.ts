import { describe, expect, test } from "bun:test";
import { ChannelType, GatewayCode, type GatewayIdentify, GatewayOperations, type GatewayResume, RelationshipType } from "@huginn/shared";
import { gateway } from "#setup";
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
import {
   expectChannelExactRecipients,
   expectChannelExactSchema,
   expectRelationshipExactSchema,
   expectUserExactSchema,
   expectUserSettingsExactSchema,
} from "#tests/expect-utils";

describe("Connection", () => {
   test("should close the websocket with code 4001 (UNKNOWN_OPCODE) when the sent message has an unknown op code", async (done) => {
      const { ws } = await getReadyWebSocket();

      ws.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.UNKNOWN_OPCODE);
         done();
      };

      wsSend(ws, { op: 99 });
   });

   test("should close the websocket with code 4002 (DECODE_ERROR) when sent message cannot be decoded", async (done) => {
      const { ws } = await getReadyWebSocket();

      ws.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.DECODE_ERROR);
         done();
      };

      ws.send("[123,]");
   });

   test("should close the websocket with code 4003 (NOT_AUTHENTICATED) when the websocket is not authenticated", async (done) => {
      const ws = await getWebSocket();

      ws.onmessage = ({ data }) => {
         if (testIsOpcode(data, GatewayOperations.HELLO)) {
            // TODO: We don't have a reason to send any message that requires authentication so im sending an unknown OP but the authentication state is checked first
            wsSend(ws, { op: 99, d: 0 });
         }
      };

      ws.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.NOT_AUTHENTICATED);
         done();
      };
   });

   test("should close the websocket with code 4004 (AUTHENTICATION_FAILED) when the authentication process fails", async (done) => {
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

      ws.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.AUTHENTICATION_FAILED);
         done();
      };
   });

   test("should close the websocket with code 4005 (ALREADY_AUTHENTICATED) when the websocket is already authenticated", async (done) => {
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

      ws.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.ALREADY_AUTHENTICATED);
         done();
      };
   });

   test("should close the websocket with code 4006 (INVALID_SEQ) when the sent sequence number for resuming is invalid", async (done) => {
      const { ws, user, readyData } = await getReadyWebSocket();
      ws.close();

      for (let i = 0; i < 10; i++) {
         // @ts-ignore
         gateway.sendToTopic(user.id.toString(), { op: GatewayOperations.DISPATCH, s: 0, d: i });
      }

      const ws2 = await getWebSocket();

      const resumeData: GatewayResume = {
         op: GatewayOperations.RESUME,
         d: { sessionId: readyData.sessionId, token: user.accessToken, seq: 11 },
      };

      ws2.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.INVALID_SEQ);
         done();
      };

      ws2.onmessage = (event) => {
         if (testIsOpcode(event.data, GatewayOperations.HELLO)) {
            wsSend(ws2, resumeData);
         }
      };
   });

   test("should close the websocket with code 4009 (INVALID_SESSION) when trying to resume a non existing session", async (done) => {
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

      ws2.onclose = ({ code }) => {
         expect(code).toBe(GatewayCode.INVALID_SESSION);
         done();
      };
   });

   test("should resume the websocket when it is disconnected and has not received some messages", async (done) => {
      const { ws, readyData, user } = await getReadyWebSocket();
      ws.close();

      for (let i = 0; i < 10; i++) {
         // @ts-ignore
         gateway.sendToTopic(user.id.toString(), { op: GatewayOperations.DISPATCH, s: 0, d: i });
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
         if (testIsOpcode(event.data, GatewayOperations.DISPATCH)) {
            expect(data.d).toBe(received);
            received++;
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
            expectChannelExactSchema(data.d.privateChannels[0], ChannelType.DM, channel.id, undefined, undefined, undefined, false);
            expectChannelExactRecipients(data.d.privateChannels[0], [user2]);
            expectRelationshipExactSchema(data.d.relationships[0], RelationshipType.FRIEND);
            expectUserExactSchema(data.d.user, user.id, user.username, user.displayName, user.avatar, user.flags, user.email, user.password, false);
            expectUserSettingsExactSchema(data.d.userSettings, { status: "online" });
            done();
         }
      };
   });
});
