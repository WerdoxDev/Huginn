import { testHandler } from "@huginn/backend-shared";
import { ChannelType, MessageType, resolveImage } from "@huginn/shared";
import { describe, expect, test } from "bun:test";
import pathe from "pathe";

import { expectMessageExactSchema } from "#tests/expect-utils";
import {
   authHeader,
   createTestChannel,
   createTestMessages,
   createTestRelationships,
   createTestUsers,
   getReadyWebSocket,
   isCDNRunning,
   multiDone,
   testIsDispatch,
} from "#tests/utils";

describe("Message", () => {
   test(
      "should send message_create when a message is created in a channel",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const { ws: ws3 } = await getReadyWebSocket(user3);
         const tryDone = multiDone(done, 5);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               if (data.d.channelId === channel.id.toString()) {
                  expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, content: "test", channelId: channel.id, author: user });
                  tryDone();
               } else {
                  expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, content: "test", channelId: groupChannel.id, author: user });
                  tryDone();
               }
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               if (data.d.channelId === channel.id.toString()) {
                  expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, content: "test", channelId: channel.id, author: user });
                  tryDone();
               } else {
                  expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, content: "test", channelId: groupChannel.id, author: user });
                  tryDone();
               }
            }
         };

         ws3.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               if (data.d.channelId === groupChannel.id.toString()) {
                  expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, content: "test", channelId: groupChannel.id, author: user });
                  tryDone();
               }
            }
         };

         await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", { content: "test" });
         await testHandler(`/api/channels/${groupChannel.id}/messages`, authHeader(user.accessToken), "POST", { content: "test" });
      },
      { timeout: 10000 },
   );

   test(
      "should send message_create of type 1 (RECIPIENT_ADD) when a recipient is added to a type 1 (GROUP_DM) channel",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, { type: MessageType.RECIPIENT_ADD, content: "", channelId: groupChannel.id, author: user2, mentions: [user3] });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, { type: MessageType.RECIPIENT_ADD, content: "", channelId: groupChannel.id, author: user2, mentions: [user3] });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${groupChannel.id}/recipients/${user3.id}`, authHeader(user2.accessToken), "PUT");
      },
      { timeout: 10000 },
   );

   test(
      "should send message_create of type 2 (RECIPIENT_REMOVE) when a recipient is removed from a type 1 (GROUP_DM) channel",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.RECIPIENT_REMOVE,
                  content: "",
                  channelId: groupChannel.id,
                  author: user,
                  mentions: [user3],
               });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.RECIPIENT_REMOVE,
                  content: "",
                  channelId: groupChannel.id,
                  author: user,
                  mentions: [user3],
               });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${groupChannel.id}/recipients/${user3.id}`, authHeader(user.accessToken), "DELETE");
      },
      { timeout: 10000 },
   );

   test(
      "should send message_create of type 4 (CHANNEL_NAME_CHANGED) when a recipient changes the name of a type 1 (GROUP_DM) channel",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const { ws: ws3 } = await getReadyWebSocket(user3);
         const tryDone = multiDone(done, 3);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, { type: MessageType.CHANNEL_NAME_CHANGED, content: "test-edited", channelId: groupChannel.id, author: user2 });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, { type: MessageType.CHANNEL_NAME_CHANGED, content: "test-edited", channelId: groupChannel.id, author: user2 });
               tryDone();
            }
         };

         ws3.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, { type: MessageType.CHANNEL_NAME_CHANGED, content: "test-edited", channelId: groupChannel.id, author: user2 });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user2.accessToken), "PATCH", {
            name: "test-edited",
         });
      },
      { timeout: 10000 },
   );

   test(
      "should send message_create of type 7 (CHANNEL_OWNER_CHANGED) when the owner of a type 1 (GROUP_DM) channel is changed",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const { ws: ws3 } = await getReadyWebSocket(user3);
         const tryDone = multiDone(done, 3);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_OWNER_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user,
                  mentions: [user2],
               });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_OWNER_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user,
                  mentions: [user2],
               });
               tryDone();
            }
         };

         ws3.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_OWNER_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user,
                  mentions: [user2],
               });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user.accessToken), "PATCH", {
            owner: user2.id.toString(),
         });
      },
      { timeout: 10000 },
   );

   test.skipIf(!isCDNRunning)(
      "should send message_create of type 5 (CHANNEL_ICON_CHANGED) when a recipient changes the icon of a type 1 (GROUP_DM) channel",
      async (done) => {
         const [user, user2, user3] = await createTestUsers(3);

         await createTestRelationships(user.id, user2.id, true);
         await createTestRelationships(user.id, user3.id, true);
         const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const { ws: ws3 } = await getReadyWebSocket(user3);
         const tryDone = multiDone(done, 3);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_ICON_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user2,
                  mentions: [],
               });
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_ICON_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user2,
                  mentions: [],
               });
               tryDone();
            }
         };

         ws3.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_create")) {
               expectMessageExactSchema(data.d, {
                  type: MessageType.CHANNEL_ICON_CHANGED,
                  content: "",
                  channelId: groupChannel.id,
                  author: user2,
                  mentions: [],
               });
               tryDone();
            }
         };

         const iconData = await resolveImage(pathe.resolve(__dirname, "../pixel.png"));

         await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user2.accessToken), "PATCH", {
            icon: iconData,
         });
      },
      { timeout: 10000 },
   );

   test("should send message_delete when a user deletes a message in a channel", async (done) => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(user.id, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const { ws } = await getReadyWebSocket(user);
      const { ws: ws2 } = await getReadyWebSocket(user2);
      const tryDone = multiDone(done, 2);

      ws.onmessage = ws2.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "message_delete")) {
            expect(data.d).toStrictEqual({
               id: message.id.toString(),
               channelId: channel.id.toString(),
            });
            tryDone();
         }
      };

      await testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "DELETE");
   });
});
