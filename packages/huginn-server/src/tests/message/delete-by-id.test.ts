import { testHandler } from "@huginn/backend-shared";
import { ChannelType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestChannel, createTestMessages, createTestUsers } from "#tests/utils";

describe("DELETE /api/channels/:channelId/messages/:messageId", () => {
   test("should return 'Invalid Form Body' when id is invalid or body constrains are not met", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const result = testHandler(`/api/channels/${channel.id}/messages/invalid`, authHeader(user.accessToken), "DELETE");
      expect(result).rejects.toThrow("Snowflake"); // Invalid id

      const result2 = testHandler(`/api/channels/${channel.id}/messages/000000000000000000`, authHeader(user.accessToken), "DELETE");
      expect(result2).rejects.toThrow("Unknown Message"); // Invalid id
   });

   test("should return 'Missing Access' or 'Missing Permission' when user is not part of the channel or is deleting another user's message", async () => {
      const [user, user2, user3] = await createTestUsers(3);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user2.id, 1);

      // User does not have the channel
      const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user3.accessToken), "DELETE");
      expect(result2).rejects.toThrow("Missing Access");

      // User is not the message author
      const result3 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "DELETE");
      expect(result3).rejects.toThrow("Missing Permission");
   });

   test("should delete a message in the channel when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "DELETE", undefined);
      expect(result).resolves.toBe(undefined);
   });
});
