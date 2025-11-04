import { describe, expect, test } from "bun:test";
import { GatewayCode } from "@huginn/shared";
import { getAuthenticatedClient, getClient, multiDone } from "../test-utils";

describe("Gateway Connection", () => {
   test("should set status to 'connecting' when connecting", async (done) => {
      const client = getClient();

      client.gateway.connect();
      expect(client.gateway.socket).toBeDefined();

      const unlisten = client.gateway.listen("connected", () => {
         expect(client.gateway.status).toBe("connecting");
         unlisten();
         done();
      });
   });

   test("should set status to 'connected' when hello is received", async (done) => {
      const client = getClient();

      client.gateway.connect();

      const unlisten = client.gateway.listen("hello", () => {
         expect(client.gateway.status).toBe("connected");
         unlisten();
         done();
      });
   });

   test("should set status to 'disconnected' when connection is closed (any reason)", async (done) => {
      const client = getClient();

      client.gateway.connect();
      const unlisten = client.gateway.listen("hello", () => {
         expect(client.gateway.status).not.toBe("disconnected");
         const unlisten2 = client.gateway.listen("disconnected", () => {
            expect(client.gateway.status).toBe("disconnected");
            unlisten();
            unlisten2();
            done();
         });

         client.gateway.close();
      });
   });

   test("should set status to 'reconnecting' when disconnected without intentional reason", async (done) => {
      const client = getClient();

      client.gateway.connect();
      await client.gateway.waitForEvents(["hello"]);

      client.gateway.socket?.close();
      const unlisten = client.gateway.listen("status_changed", (status) => {
         expect(status).toBe("reconnecting");
         unlisten();
         done();
      });
   });

   test("should reset everything when socket was closed with code 4010 or 4009 (INTENTIONAL_CLOSE,INVALID_SESSION)", async (done) => {
      const tryDone = multiDone(done, 2);

      for (let i = 0; i < 2; i++) {
         const { client } = await getAuthenticatedClient();

         // @ts-ignore
         expect(client.gateway.sequence).toBeDefined();
         expect(client.gateway.sessionId).toBeDefined();

         const unlisten = client.gateway.listen("disconnected", () => {
            setTimeout(() => {
               // @ts-ignore
               expect(client.gateway.sequence).toBeUndefined();
               expect(client.gateway.sessionId).toBeUndefined();

               unlisten();
               tryDone();
            }, 0);
         });

         client.gateway.socket?.close(i === 0 ? GatewayCode.INTENTIONAL_CLOSE : GatewayCode.INVALID_SESSION);
      }
   });
});
