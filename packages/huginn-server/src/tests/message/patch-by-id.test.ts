import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { type APIPatchMessageResult, type APIPostDefaultMessageResult, ChannelType, MessageType } from "@huginn/shared";
import { expectMessageExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestMessages, createTestUsers, getReadyWebSocket, testIsDispatch } from "#tests/utils";

describe("PATCH /api/channels/:channelId/messages/:messageId", () => {
   test("should return 'Invalid Form Body' when id is invalid or body constrains are not met", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = testHandler(`/api/channels/${channel.id}/messages/invalid`, authHeader(user.accessToken), "PATCH", { content: "test" });
      expect(result).rejects.toThrow("Snowflake"); // Invalid id

      const result2 = testHandler(`/api/channels/${channel.id}/messages/000000000000000000`, authHeader(user.accessToken), "PATCH", {
         content: "test",
      });
      expect(result2).rejects.toThrow("Unknown Message"); // Invalid id

      const result3 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "PATCH", {});
      expect(result3).rejects.toThrow("Invalid Form Body"); // No body passed
   });

   test("should return 'Unauthorized' or 'Missing Access' or 'Missing Permission' when no token is passed or user is not part of the channel or user is not the author", async () => {
      const [user, user2, user3] = await createTestUsers(3);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const [message] = await createTestMessages(channel.id, user2.id, 1);

      // No token
      const result = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, {}, "PATCH", { content: "test" });
      expect(result).rejects.toThrow("Unauthorized");

      // User does not have the channel
      const result2 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user3.accessToken), "PATCH", { content: "test" });
      expect(result2).rejects.toThrow("Missing Access");

      // User is not the message author
      const result3 = testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "PATCH", { content: "test" });
      expect(result3).rejects.toThrow("Missing Permission");
   });

   test("should edit a message in the channel when the request is successful", async () => {
      const [user, user2] = await createTestUsers(2);
      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const [message] = await createTestMessages(channel.id, user.id, 1);

      const result = (await testHandler(`/api/channels/${channel.id}/messages/${message.id}`, authHeader(user.accessToken), "PATCH", {
         content: "Discord is the worst",
      })) as APIPatchMessageResult;

      expectMessageExactSchema(result, MessageType.DEFAULT, BigInt(result.id), channel.id, user, "Discord is the worst", undefined);
   });
   test(
      "should return a message with no embed when it is updated with no embeds",
      async (done) => {
         const [user, user2] = await createTestUsers(2);
         const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

         const { ws } = await getReadyWebSocket(user);

         const result = (await testHandler(`/api/channels/${channel.id}/messages`, authHeader(user.accessToken), "POST", {
            content: "https://huginn.dev",
         })) as APIPostDefaultMessageResult;

         let isDone = false;
         ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (testIsDispatch(data, "message_update")) {
               // message_update is also called when we call the patch message route below.
               if (isDone) return;

               expect(data.d.id).toBe(result.id);
               expect(data.d.embeds).toBeArray();
               expect(data.d.embeds).toHaveLength(1);

               isDone = true;
               const result2 = (await testHandler(`/api/channels/${channel.id}/messages/${data.d.id}`, authHeader(user.accessToken), "PATCH", {
                  embeds: [],
               })) as APIPatchMessageResult;

               expect(result2.embeds).toBeArray();
               expect(result2.embeds).toHaveLength(0);

               done();
            }
         };
      },
      { timeout: 10000 },
   );
});
