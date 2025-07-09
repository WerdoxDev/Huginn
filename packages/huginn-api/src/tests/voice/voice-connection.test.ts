import { describe, expect, test } from "bun:test";
import { connectVoice, getAuthenticatedClient } from "../test-utils";

describe("Voice Connection", () => {
   test("should set status to 'connecting' when connecting to voice", async () => {
      const { client, readyData } = await getAuthenticatedClient();
      await connectVoice(client, readyData);

      await client.voice.waitForEvents(["open"]);
      expect(client.voice.status).toBe("connecting");
      expect(client.voice.connectionInfo).toBeDefined();

      await client.gateway.disconnectVoice();
   })

   test("should set status to 'connected' when hello is received", async () => {
      const { client, readyData } = await getAuthenticatedClient();
      await connectVoice(client, readyData);

      await client.voice.waitForEvents(["hello"]);
      expect(client.voice.status).toBe("connected");
      expect(client.voice.connectionInfo).toBeDefined();

      await client.gateway.disconnectVoice();
   })

   test("should set status to 'disconnected' when connection is closed (any reason)", async (done) => {
      const { client, readyData } = await getAuthenticatedClient();
      await connectVoice(client, readyData);

      await client.voice.waitForEvents(["hello"]);

      const unlisten = client.voice.listen("close", async () => {
         expect(client.voice.status).toBe("disconnected");

         unlisten();
         done();
         await client.gateway.disconnectVoice();
      })

      client.voice.socket?.close();
   })

   test("should set status to 'reconnecting' when disconnected without intentional reason", async (done) => {
      const { client, readyData } = await getAuthenticatedClient();
      await connectVoice(client, readyData);

      await client.voice.waitForEvents(["hello"]);

      client.voice.socket?.close();
      const unlisten = client.voice.listen("status_changed", (status) => {
         expect(status).toBe("reconnecting");
         unlisten();
         done();
         setTimeout(async () => {
            await client.gateway.disconnectVoice();
         }, 0)
      });
   })

   test("should wait for gateway to reconnect when trying to reconnect to voice", async (done) => {
      const { client, readyData } = await getAuthenticatedClient();
      await connectVoice(client, readyData);

      await client.voice.waitForEvents(["hello"]);

      client.voice.socket?.close();

      const unlisten = client.voice.listen("status_changed", async (status) => {
         if (status === "reconnecting") {
            expect(status).toBe("reconnecting");
            client.gateway.socket?.close();

            await client.voice.waitForEvents(["hello"]);

            expect(client.gateway.status).toBe("authenticated");
            expect(client.voice.status).toBe("connected");
            unlisten();
            done();

            await client.gateway.disconnectVoice();
         }
      });
   })
})
