import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { ChannelType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";

describe("PUT /api/channels/:channelId/messages/:messageId/reactions/:emojiKey/@me", () => {
   test(
      "should return 'Unknown Emoji' when emoji key is invalid ",
      async () => {
         const [user, user2] = await createTestUsers(2);
         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);
         const emojiKey = encodeURIComponent("unknown");

         const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user.accessToken), "PUT");
         expect(result2).rejects.toThrow("Unknown Emoji"); // Unknown emoji
      },
      { timeout: 10000 },
   );

   test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
      const [user, user2, user3] = await createTestUsers(3);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const emojiKey = encodeURIComponent("😎");

      // No token
      const result = testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, {}, "PUT");
      expect(result).rejects.toThrow("Unauthorized");

      // User does not have the channel
      const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user3.accessToken), "PUT");
      expect(result2).rejects.toThrow("Missing Access");
   });

   test("should add a reaction to a message", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);
      const emoji = "😎";
      const emojiKey = encodeURIComponent(emoji);

      await testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user.accessToken), "PUT");

      const reaction = await prisma.reaction.findUnique({
         where: {
            channelId_messageId_userId_emojiKey: {
               channelId: channel.id,
               messageId: message.id,
               userId: user.id,
               emojiKey: emoji,
            },
         },
      });

      expect(reaction).not.toBeNull();

      const aggregate = await prisma.reactionAggregate.findUnique({
         where: {
            messageId_emojiKey: {
               messageId: message.id,
               emojiKey: emoji,
            },
         },
      });

      expect(aggregate).not.toBeNull();
      expect(aggregate?.count).toBe(1);

      await testHandler(`/api/channels/${channel.id}/messages/${message.id}/reactions/${emojiKey}/@me`, authHeader(user.accessToken), "PUT");

      const reactions = await prisma.reaction.findMany({
         where: {
            channelId: channel.id,
            messageId: message.id,
            userId: user.id,
            emojiKey: emoji,
         },
      });

      expect(reactions).toHaveLength(1);

      const aggregateAfterRepeat = await prisma.reactionAggregate.findUnique({
         where: {
            messageId_emojiKey: {
               messageId: message.id,
               emojiKey: emoji,
            },
         },
      });

      expect(aggregateAfterRepeat?.count).toBe(1);
   });
});
