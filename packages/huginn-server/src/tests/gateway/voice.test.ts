import { testHandler } from "@huginn/backend-shared";
import { ChannelType, GatewayCode, GatewayOperations, type GatewayPayload, type GatewayUpdateVoiceState, MessageType, type Snowflake } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { expectCallStateExactSchema, expectVoiceServerExactSchema, expectVoiceStateExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers, getIdentifiedWebSocket, getReadyWebSocket, multiDone, testIsDispatch, wsSend } from "#tests/utils";

describe("Voice", () => {
   test("should receive both VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE after sending OP 6", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      const tryDone = multiDone(done, 3);

      const data: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isScreenSharing: false,
            isAudioStreaming: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data);

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "voice_server_update")) {
            expectVoiceServerExactSchema(data.d);
            tryDone();
         }
         if (testIsDispatch(data, "voice_state_update")) {
            expectVoiceStateExactSchema(data.d, { channelId: channel.id.toString(), guildId: null, userId: user.id.toString(), sessionId });
            tryDone();
         }
      };

      // Other users should also get this user's voice state update
      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "voice_state_update")) {
            expectVoiceStateExactSchema(data.d, { channelId: channel.id.toString(), guildId: null, userId: user.id.toString(), sessionId });
            tryDone();
         }
      };
   });

   test("should send CALL_CREATE and create a call message when a channel is rang using /channels/channel.id/call/ring", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const { ws } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      // This is necessary for some unknown reason
      await new Promise((r) => setTimeout(r, 1000));

      const tryDone = multiDone(done, 2);

      let messageId: Snowflake;
      ws.onmessage = ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "message_create")) {
            if (data.d.type === MessageType.CALL) {
               messageId = data.d.id;
            }
         }
         if (testIsDispatch(data, "call_create")) {
            expectCallStateExactSchema(data.d, { channelId: channel.id.toString(), messageId, ringing: [user2.id.toString()] });
            tryDone();
         }
      };

      const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
      expect(result).resolves.toBe(undefined);
   });

   test("should send CALL_UPDATE when a user joins a call", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const { ws } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      const tryDone = multiDone(done, 2);

      // This is necessary for some unknown reason
      await new Promise((r) => setTimeout(r, 1000));

      let messageId: Snowflake;
      ws.onmessage = ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "message_create")) {
            if (data.d.type === MessageType.CALL) {
               messageId = data.d.id;
            }
         }
         if (testIsDispatch(data, "call_update")) {
            expectCallStateExactSchema(data.d, { channelId: channel.id.toString(), messageId, ringing: [] });
            tryDone();
         }
      };

      const data: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data);

      const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
      expect(result).resolves.toBe(undefined);

      wsSend(ws2, data);
   });

   test("should send CALL_DELETE when all users leave a call", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const { ws } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      const tryDone = multiDone(done, 2);

      // This is necessary for some unknown reason
      await new Promise((r) => setTimeout(r, 1000));

      ws.onmessage = ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "call_delete")) {
            expectCallStateExactSchema(data.d, { channelId: channel.id.toString() });
            tryDone();
         }
      };

      const data: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      const data2: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: null,
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data);

      const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
      expect(result).resolves.toBe(undefined);

      wsSend(ws2, data);
      wsSend(ws, data2);
      wsSend(ws2, data2);
   });

   test(
      "should send VOICE_STATE_UPDATE a user leaves a call or disconnects",
      async (done) => {
         const [user, user2] = await createTestUsers(2);

         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2, sessionId } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 4);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "voice_state_update")) {
               if (data.d.userId === user2.id.toString() && data.d.channelId) {
                  expectVoiceStateExactSchema(data.d, { channelId: channel.id.toString(), guildId: null, userId: user2.id.toString(), sessionId });
                  tryDone();
               } else if (data.d.userId === user2.id.toString() && !data.d.channelId) {
                  expectVoiceStateExactSchema(data.d, { channelId: null, guildId: null, userId: user2.id.toString(), sessionId });
                  tryDone();
               }
            }
         };

         const data: GatewayUpdateVoiceState = {
            op: GatewayOperations.VOICE_STATE_UPDATE,
            d: {
               channelId: channel.id.toString(),
               guildId: null,
               isAudioDeafened: false,
               isAudioMuted: false,
               isAudioStreaming: false,
               isScreenSharing: false,
               isCameraOn: false,
            },
         };

         const data2: GatewayUpdateVoiceState = {
            op: GatewayOperations.VOICE_STATE_UPDATE,
            d: {
               channelId: null,
               guildId: null,
               isAudioDeafened: false,
               isAudioMuted: false,
               isAudioStreaming: false,
               isScreenSharing: false,
               isCameraOn: false,
            },
         };

         wsSend(ws, data);

         setTimeout(() => {
            wsSend(ws2, data);
         }, 100);

         setTimeout(() => {
            wsSend(ws2, data2);
         }, 200);

         setTimeout(() => {
            wsSend(ws2, data);
         }, 300);

         setTimeout(() => {
            ws2.close(GatewayCode.INTENTIONAL_CLOSE);
         }, 400);
      },
      { timeout: 10000 },
   );

   test("should send both voice states and call states in READY dispatch", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const { ws, sessionId } = await getReadyWebSocket(user);

      let messageId: Snowflake;
      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "message_create")) {
            if (data.d.type === MessageType.CALL) {
               messageId = data.d.id;
            }
         }
      };

      const data: GatewayUpdateVoiceState = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data);

      const result = testHandler(`/api/channels/${channel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });
      expect(result).resolves.toBe(undefined);

      const { ws: ws2 } = await getIdentifiedWebSocket(user2);
      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);

         if (testIsDispatch(data, "ready")) {
            expect(data.d.voiceStates).toHaveLength(1);
            expect(data.d.callStates).toHaveLength(1);
            expectVoiceStateExactSchema(data.d.voiceStates[0], { channelId: channel.id.toString(), guildId: null, userId: user.id.toString(), sessionId });
            expectCallStateExactSchema(data.d.callStates[0], { channelId: channel.id.toString(), messageId, ringing: [user2.id.toString()] });
            done();
         }
      };
   });

   test("should first send a null VOICE_STATE_UPDATE when user changes to another channel", async (done) => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.GROUP_DM, user.id, user2.id);
      const channel2 = await createTestChannel(undefined, ChannelType.GROUP_DM, user.id, user2.id);

      const { ws, sessionId } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      const tryDone = multiDone(done, 3);

      let updateCount = 0;
      ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);

         // Check if it's the correct channel the first time.
         if (testIsDispatch(data, "voice_state_update")) {
            expectVoiceStateExactSchema(data.d, {
               channelId: updateCount === 0 ? channel.id.toString() : updateCount === 1 ? null : channel2.id.toString(),
               guildId: null,
               userId: user.id.toString(),
               sessionId,
            });
            updateCount++;
            tryDone();
         }
      };

      // First join the channel voice
      const data: GatewayPayload = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data);

      await new Promise((r) => setTimeout(r, 500));

      // Then join another channel without leaving the last one
      const data2: GatewayPayload = {
         op: GatewayOperations.VOICE_STATE_UPDATE,
         d: {
            channelId: channel2.id.toString(),
            guildId: null,
            isAudioDeafened: false,
            isAudioMuted: false,
            isAudioStreaming: false,
            isScreenSharing: false,
            isCameraOn: false,
         },
      };

      wsSend(ws, data2);
   });

   test(
      "should send CALL_CREATE and VOICE_STATE_UPDATE to a user which just joined a channel which has an existing ongoing call",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id);

         const { ws, sessionId } = await getReadyWebSocket(user);
         const { ws: ws2, sessionId: sessionId2 } = await getReadyWebSocket(user2);
         const { ws: ws3 } = await getReadyWebSocket(user3);
         const tryDone = multiDone(done, 3);

         ws3.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "call_create")) {
               expectCallStateExactSchema(data.d, { channelId: groupChannel.id.toString(), messageId: undefined, ringing: [] });
               tryDone();
            }
            if (testIsDispatch(data, "voice_state_update")) {
               if (data.d.userId === user.id.toString()) {
                  expectVoiceStateExactSchema(data.d, {
                     channelId: groupChannel.id.toString(),
                     guildId: null,
                     userId: user.id.toString(),
                     sessionId,
                     flags: {
                        isAudioDeafened: true,
                        isAudioMuted: false,
                        isAudioStreaming: false,
                        isScreenSharing: false,
                        isCameraOn: true,
                     },
                  });
                  tryDone();
               } else if (data.d.userId === user2.id.toString()) {
                  expectVoiceStateExactSchema(data.d, {
                     channelId: groupChannel.id.toString(),
                     guildId: null,
                     userId: user2.id.toString(),
                     sessionId: sessionId2,
                     flags: {
                        isAudioDeafened: false,
                        isAudioMuted: true,
                        isAudioStreaming: true,
                        isScreenSharing: false,
                        isCameraOn: false,
                     },
                  });
                  tryDone();
               }
            }
         };

         await testHandler(`/api/channels/${groupChannel.id}/call/ring`, authHeader(user.accessToken), "POST", { recipients: null });

         const data: GatewayPayload = {
            op: GatewayOperations.VOICE_STATE_UPDATE,
            d: {
               channelId: groupChannel.id.toString(),
               guildId: null,
               isAudioDeafened: true,
               isAudioMuted: false,
               isAudioStreaming: false,
               isScreenSharing: false,
               isCameraOn: true,
            },
         };

         const data2: GatewayPayload = {
            op: GatewayOperations.VOICE_STATE_UPDATE,
            d: {
               channelId: groupChannel.id.toString(),
               guildId: null,
               isAudioDeafened: false,
               isAudioMuted: true,
               isAudioStreaming: true,
               isScreenSharing: false,
               isCameraOn: false,
            },
         };

         wsSend(ws, data);
         wsSend(ws2, data2);

         await new Promise((r) => setTimeout(r, 1000));

         await testHandler(`/api/channels/${groupChannel.id}/recipients/${user3.id}`, authHeader(user.accessToken), "PUT");
      },
      { timeout: 10000 },
   );
});
