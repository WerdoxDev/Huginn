import { testHandler } from "@huginn/backend-shared";
import { type APIGetUserChannelsResult, ChannelType } from "@huginn/shared";
import { describe, expect, test } from "bun:test";

import { expectChannelExactRecipients, expectChannelExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers } from "#tests/utils";

describe("GET /users/@me/channels", () => {
   test("should return 'Unauthorized' when no token is passed", async () => {
      const [user, user2] = await createTestUsers(2);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

      const result2 = testHandler(`/api/channels/${channel.id}`, {}, "GET");
      expect(result2).rejects.toThrow("Unauthorized");
   });
   test("should return all of the user's channels when the request is successful", async () => {
      const [user, user2, user3] = await createTestUsers(3);

      const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
      const channel2 = await createTestChannel(undefined, ChannelType.DM, user.id, user3.id);

      const result = (await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "GET")) as APIGetUserChannelsResult;

      expect(result).toBeArray();
      const id1 = result.findIndex((c) => c.id === channel.id.toString());
      const id2 = result.findIndex((c) => c.id === channel2.id.toString());
      expect(id1).not.toBe(-1);
      expect(id2).not.toBe(-1);
      expectChannelExactSchema(result[id1], { type: ChannelType.DM, id: channel.id });
      // Getting channels should not include the user who sent the request
      expectChannelExactRecipients(result[id1], [user2]);

      expectChannelExactSchema(result[id2], { type: ChannelType.DM, id: channel2.id });
      // Getting channels should not include the user who sent the request
      expectChannelExactRecipients(result[id2], [user3]);
   });
});
