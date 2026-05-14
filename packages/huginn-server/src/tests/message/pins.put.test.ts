import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";
import { testHandler } from "@huginn/backend-shared";
import { type APIPutChannelPinResult, ChannelType, MessageType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

describe("PUT /api/channels/:channelId/messages/pins/:messageId", () => {
   test("should return 'Invalid Form Body' when id is invalid", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = testHandler(`/api/channels/invalid/messages/pins/${message.id}`, authHeader(user.accessToken), "PUT");
      expect(result).rejects.toThrow("Snowflake"); // Invalid id

      const result2 = testHandler(`/api/channels/${channel.id}/messages/pins/invalid`, authHeader(user.accessToken), "PUT");
      expect(result2).rejects.toThrow("Snowflake"); // Invalid id

      const result3 = testHandler(`/api/channels/${channel.id}/messages/pins/000000000000000000`, authHeader(user.accessToken), "PUT");
      expect(result3).rejects.toThrow("Unknown Message"); // Unknown message
   });

   test("should return 'Unauthorized' when no token is passed or user is not part of the channel", async () => {
      const [user, user2, user3] = await createTestUsers(3);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      // No token
      const result = testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, {}, "PUT");
      expect(result).rejects.toThrow("Unauthorized");

      // User not part of the channel
      const result2 = testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, authHeader(user3.accessToken), "PUT");
      expect(result2).rejects.toThrow("Missing Access");
   });

   test("should pin a message in the channel when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = (await testHandler(
         `/api/channels/${channel.id}/messages/pins/${message.id}`,
         authHeader(user.accessToken),
         "PUT",
      )) as APIPutChannelPinResult;

      expectMessageExactSchema(result.message, MessageType.DEFAULT, message.id, channel.id, user, message.content);
      expect(result.message.pinned).toBeTrue();
      expect(typeof result.pinnedAt).toBe("string");
   });
});
