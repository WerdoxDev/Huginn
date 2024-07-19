import { describe, expect, test } from "bun:test";
import { getNewClient, testCredentials } from "./test-utils";

describe("auth-token", () => {
   test("auth-refresh-token", async () => {
      const client = getNewClient();

      expect(await client.tokenHandler.waitForTokenRefresh()).toBe(false);

      const result = await client.auth.login(testCredentials);

      client.user = { ...result };
      client.tokenHandler.token = result.token;
      client.tokenHandler.refreshToken = result.refreshToken;

      const oldToken = client.tokenHandler.token;

      expect(await client.tokenHandler.waitForTokenRefresh()).toBe(true);

      const newToken = client.tokenHandler.token;

      expect(newToken).not.toBe(oldToken);
   });
});
