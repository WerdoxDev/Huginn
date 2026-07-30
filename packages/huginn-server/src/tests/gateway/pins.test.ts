import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { ChannelType, MessageType } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers, getReadyWebSocket, multiDone, testIsDispatch } from "#tests/utils";

describe("Pins", () => {
   test(
      "should send message_update when a message is pinned",
      async (done) => {
         const [user, user2] = await createTestUsers(2);

         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_update") && data.d.id === message.id.toString()) {
               expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, id: message.id, channelId: channel.id, author: user, content: message.content });
               expect(data.d.pinned).toBeTrue();
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_update") && data.d.id === message.id.toString()) {
               expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, id: message.id, channelId: channel.id, author: user, content: message.content });
               expect(data.d.pinned).toBeTrue();
               tryDone();
            }
         };

         await testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, authHeader(user.accessToken), "PUT");
      },
      { timeout: 10000 },
   );

   test(
      "should send message_update when a message is unpinned",
      async (done) => {
         const [user, user2] = await createTestUsers(2);

         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);

         await prisma.messagePin.createPin({
            channelId: channel.id.toString(),
            messageId: message.id.toString(),
            pinnedById: user.id.toString(),
         });

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_update") && data.d.id === message.id.toString()) {
               expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, id: message.id, channelId: channel.id, author: user, content: message.content });
               expect(data.d.pinned).toBeFalse();
               tryDone();
            }
         };

         ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_update") && data.d.id === message.id.toString()) {
               expectMessageExactSchema(data.d, { type: MessageType.DEFAULT, id: message.id, channelId: channel.id, author: user, content: message.content });
               expect(data.d.pinned).toBeFalse();
               tryDone();
            }
         };

         await testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, authHeader(user2.accessToken), "DELETE");
      },
      { timeout: 10000 },
   );
});
