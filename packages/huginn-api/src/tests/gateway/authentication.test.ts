import { describe, expect, test } from "bun:test";
import { GatewayOperations } from "@huginn/shared";
import { getAuthenticatedClient, getClient, getConnectedClient, loginClient } from "../test-utils";

describe("Gateway Authentication", () => {
   test("should fail to authenticate when client is never connected and not logged in", async () => {
      const client = getClient();

      const promise = client.gateway.authenticate();
      expect(promise).rejects.toThrow("never connected");
   })

   test("should fail to authenticate when client is connected but not logged in", async () => {
      const client = getClient();
      client.gateway.connect();

      await client.gateway.waitForEvents(["open"]);
      expect(client.gateway.status).toBe("connecting");

      const result = await client.gateway.authenticate();
      expect(result).toStrictEqual({ authenticated: false, retryable: false });
   })

   test("should fail authentication when invalid credentials was used", async () => {
      const client = await getConnectedClient(false);
      client.tokenHandler.token = "invalid";

      const result = await client.gateway.authenticate();
      expect(result).toStrictEqual({ authenticated: false, retryable: false });
   })

   test("should fail authentication when socket is closed while authenticating (other than invalid token)", async () => {
      const client = await getConnectedClient(true);

      const unlisten = client.gateway.listen("send", (d) => {
         if (d.op === GatewayOperations.IDENTIFY) {
            setTimeout(() => {
               client.gateway.close();
               unlisten();
            }, 0)
         }
      })

      const result = await client.gateway.authenticate();
      expect(result).toStrictEqual({ authenticated: false, retryable: true });
   })

   test("should authenticate when client is logged in and connected", async () => {
      const client = await getConnectedClient(true);

      const result = await client.gateway.authenticate();

      expect(client.gateway.status).toBe("authenticated");
      expect(result).toStrictEqual({ authenticated: true, retryable: true });
      expect(client.user).toBeDefined();
   })

   test("should not fail authentication when client is already authenticated", async () => {
      const { client } = await getAuthenticatedClient();

      const result = await client.gateway.authenticate();
      expect(result).toStrictEqual({ authenticated: true, retryable: true });
      expect(client.user).toBeDefined();
   })

   test("should authenticate when client is logged in but still connecting", async () => {
      const client = getClient();
      await loginClient(client);

      client.gateway.connect();
      await client.gateway.waitForEvents(["open"]);
      expect(client.gateway.status).toBe("connecting");

      const result = await client.gateway.authenticate();
      expect(result).toStrictEqual({ authenticated: true, retryable: true });
      expect(client.user).toBeDefined();
   })

   test("should authenticate when client logged in but was disconnected", async (done) => {
      const client = await getConnectedClient(true);

      const unlisten = client.gateway.listen("close", async () => {
         expect(client.gateway.status).toBe("disconnected");

         const result = await client.gateway.authenticate();
         expect(result).toStrictEqual({ authenticated: true, retryable: true });
         expect(client.user).toBeDefined();

         unlisten();
         done();
      })

      client.gateway.socket?.close();
   })
})
