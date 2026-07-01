import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

import { expectUserSettingsExactSchema } from "#tests/expect-utils";
import { authHeader, createTestUsers, getReadyWebSocket, multiDone, testIsDispatch } from "#tests/utils";

describe("PATCH /users/@me/settings", () => {
   test("should return 'Invalid Form Body' when body constrains are not met", async () => {
      const [user] = await createTestUsers(1);

      const result = testHandler("/api/users/@me/settings", authHeader(user.accessToken), "PATCH", {});
      expect(result).rejects.toThrow("Invalid Form Body");

      const result2 = testHandler("/api/users/@me/settings", authHeader(user.accessToken), "PATCH", {
         status: "",
         theme: "",
      });
      expect(result2).rejects.toThrow("Invalid Form Body");

      const result3 = testHandler("/api/users/@me/settings", authHeader(user.accessToken), "PATCH", {
         status: "invalid",
         theme: "cerulean",
      });
      expect(result3).rejects.toThrow("Invalid Form Body");

      const result4 = testHandler("/api/users/@me/settings", authHeader(user.accessToken), "PATCH", {
         status: "online",
         theme: "invalid",
      });
      expect(result4).rejects.toThrow("Invalid Form Body");
   });

   test("should return 'Unauthorized' when no token is passed", async () => {
      await createTestUsers(1);

      // No token
      const result = testHandler("/api/users/@me/settings", { status: "online", theme: "cerulean" }, "PATCH");
      expect(result).rejects.toThrow("Unauthorized");
   });

   test("should return an edited user settings when request is successful", async (done) => {
      const [user] = await createTestUsers(1);
      const { ws } = await getReadyWebSocket(user);

      const tryDone = multiDone(done, 2);

      ws.onmessage = (event) => {
         const data = JSON.parse(event.data);
         if (testIsDispatch(data, "settings_update")) {
            expectUserSettingsExactSchema(data.d, { status: "offline", theme: "pine-green", pinnedChannels: [] });
            tryDone();
         }
      };

      const result = await testHandler("/api/users/@me/settings", authHeader(user.accessToken), "PATCH", {
         status: "offline",
         theme: "pine-green",
         pinnedChannels: [],
      });
      expectUserSettingsExactSchema(result, { status: "offline", theme: "pine-green", pinnedChannels: [] });
      tryDone();
   });
});
