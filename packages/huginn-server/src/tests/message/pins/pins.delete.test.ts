import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { ChannelType } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestChannel, createTestMessagePin, createTestMessages, createTestUsers } from "#tests/utils";

describe("DELETE /api/channels/:channelId/messages/pins/:messageId", () => {
   test("should return 'Invalid Form Body' when id is invalid", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = testHandler(`/api/channels/${channel.id}/messages/pins/invalid`, authHeader(user.accessToken), "DELETE");
      expect(result).rejects.toThrow("Snowflake"); // Invalid id

      const result2 = testHandler(`/api/channels/${channel.id}/messages/pins/000000000000000000`, authHeader(user.accessToken), "DELETE");
      expect(result2).rejects.toThrow("Unknown Message Pin"); // Unknown pin
   });

   test(
      "should return 'Missing Access' when user is not part of the channel",
      async () => {
         const [user, user2, user3] = await createTestUsers(3);

         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
         const [message] = await createTestMessages(channel.id, user.id, 1);

         await createTestMessagePin(channel.id, message.id, user.id);

         await new Promise((resolve) => setTimeout(resolve, 1000));
         const result = testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, authHeader(user3.accessToken), "DELETE");

         expect(result).rejects.toThrow("Missing Access");
      },
      { timeout: 10000 },
   );

   test("should allow any channel member to delete a pin when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      await createTestMessagePin(channel.id, message.id, user.id);

      const result = testHandler(`/api/channels/${channel.id}/messages/pins/${message.id}`, authHeader(user2.accessToken), "DELETE");
      expect(result).resolves.toBe(undefined);

      const pinExists = await prisma.messagePin.exists({ messageId: BigInt(message.id) });
      expect(pinExists).toBeFalse();

      const updatedMessage = await prisma.message.getById(channel.id.toString(), message.id.toString(), { select: { pinned: true } });
      expect(updatedMessage.pinned).toBeFalse();
   });
});
