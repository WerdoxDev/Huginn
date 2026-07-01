import { testHandler } from "@huginn/backend-shared";
import { ChannelType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestChannel, createTestMessages, createTestUsers, getReadyWebSocket, multiDone, testIsDispatch } from "#tests/utils";

describe("Reaction websocket events", () => {
   test(
      "should send message_reaction_add when a user adds a reaction",
      async (done) => {
         const [user, user2] = await createTestUsers(2);
         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);
         const emoji = "😎";
         const emojiKey = encodeURIComponent(emoji);

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_reaction_add")) {
               expect(data.d).toStrictEqual({
                  channelId: channel.id.toString(),
                  messageId: message.id.toString(),
                  userId: user2.id.toString(),
                  emoji: { id: null, name: emoji },
               });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user2.accessToken), "PUT");
      },
      { timeout: 10000 },
   );

   test(
      "should send message_reaction_remove when a user removes a reaction",
      async (done) => {
         const [user, user2] = await createTestUsers(2);
         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);
         const emoji = "😎";
         const emojiKey = encodeURIComponent(emoji);

         await testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user2.accessToken), "PUT");

         const { ws } = await getReadyWebSocket(user);
         const { ws: ws2 } = await getReadyWebSocket(user2);
         const tryDone = multiDone(done, 2);

         ws.onmessage = ws2.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_reaction_remove")) {
               expect(data.d).toStrictEqual({
                  channelId: channel.id.toString(),
                  messageId: message.id.toString(),
                  userId: user2.id.toString(),
                  emoji: { id: null, name: emoji },
               });
               tryDone();
            }
         };

         await testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user2.accessToken), "DELETE");
      },
      { timeout: 10000 },
   );
});
