import { describe, expect, test } from "bun:test";
import { getLoggedClient, getNewClient } from "../test-utils";

describe("auth-init-with-token", () => {
   test("auth-init-with-token-successful", async () => {
      const client = await getLoggedClient();

      const accessToken = client.tokenHandler.token;

      const newClient = getNewClient();
      await newClient.initializeWithToken({ token: accessToken });

      expect(newClient.user).toBeDefined();
   });

   test("auth-init-with-refresh-token-successful", async () => {
      const client = await getLoggedClient();

      const refreshToken = client.tokenHandler.refreshToken;

      const newClient = getNewClient();
      await newClient.initializeWithToken({ refreshToken: refreshToken });

      expect(newClient.user).toBeDefined();
   });
});
