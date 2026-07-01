import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIGetChannelPinsResult, ChannelType, MessageType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";

describe("GET /api/channels/:channelId/messages/pins", () => {
   test("should return 'Invalid Form Body' when id is invalid", async () => {
      const [user] = await createTestUsers(1);

      const result = testHandler("/api/channels/invalid/messages/pins", authHeader(user.accessToken), "GET");
      expect(result).rejects.toThrow("Snowflake"); // Invalid id

      const result2 = testHandler("/api/channels/000000000000000000/messages/pins", authHeader(user.accessToken), "GET");
      expect(result2).rejects.toThrow("Unknown Channel"); // Unknown id
   });

   test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
      const [user, user2, user3] = await createTestUsers(3);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      // No token
      const result = testHandler(`/api/channels/${channel.id}/messages/pins`, {}, "GET");
      expect(result).rejects.toThrow("Unauthorized");

      // User not part of the channel
      const result2 = testHandler(`/api/channels/${channel.id}/messages/pins`, authHeader(user3.accessToken), "GET");
      expect(result2).rejects.toThrow("Missing Access");
   });

   test("should return a channel's pinned messages when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const messages = await createTestMessages(channel.id, user.id, 5);

      for (const message of messages) {
         await prisma.messagePin.createPin({
            channelId: channel.id.toString(),
            messageId: message.id.toString(),
            pinnedById: user.id.toString(),
         });
      }

      const result = (await testHandler(`/api/channels/${channel.id}/messages/pins`, authHeader(user.accessToken), "GET")) as APIGetChannelPinsResult;

      expect(result).toBeArray();
      expect(result).toHaveLength(5);

      const ids = result.map((pin) => BigInt(pin.message.id));
      const sorted = [...ids].sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
      expect(ids).toStrictEqual(sorted);

      for (const pin of result) {
         const source = messages.find((message) => message.id.toString() === pin.message.id);
         expect(source).toBeDefined();

         if (!source) {
            throw new Error("Expected pinned message to be present");
         }

         expectMessageExactSchema(pin.message, {
            type: MessageType.DEFAULT,
            id: source.id,
            channelId: channel.id,
            author: user,
            content: source.content,
         });
         expect(pin.message.pinned).toBeTrue();
         expect(typeof pin.pinnedAt).toBe("string");
      }
   });

   test("should return 'n' pinned messages before a given id when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const messages = await createTestMessages(channel.id, user.id, 10);

      for (const message of messages) {
         await prisma.messagePin.createPin({
            channelId: channel.id.toString(),
            messageId: message.id.toString(),
            pinnedById: user.id.toString(),
         });
      }

      const before = messages[6].id.toString();
      const result = (await testHandler(
         `/api/channels/${channel.id}/messages/pins?before=${before}&limit=3`,
         authHeader(user.accessToken),
         "GET",
      )) as APIGetChannelPinsResult;

      expect(result).toBeArray();
      expect(result).toHaveLength(3);
      expect(result.every((pin) => BigInt(pin.message.id) < BigInt(before))).toBeTrue();

      const ids = result.map((pin) => BigInt(pin.message.id));
      const sorted = [...ids].sort((a, b) => (a === b ? 0 : a > b ? -1 : 1));
      expect(ids).toStrictEqual(sorted);
   });
});
