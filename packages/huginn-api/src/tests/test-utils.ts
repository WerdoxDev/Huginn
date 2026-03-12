import type { GatewayReadyData } from "@huginn/shared";

import { expect } from "bun:test";

import { HuginnClient } from "../huginn-client";

export function getClient(): HuginnClient {
   const client = new HuginnClient({
      gateway: {
         createSocket(url) {
            return new WebSocket(url);
         },
         url: "ws://localhost:3004/gateway",
      },
      voice: {
         createSocket(url) {
            return new WebSocket(url);
         },
         url: "http://192.168.178.51:3003/voice-gateway",
      },
      rest: { api: "http://localhost:3004/api" },
   });

   return client;
}

export async function loginClient(client: HuginnClient): Promise<{ token: string; refreshToken: string }> {
   await client.login({ username: "internal", password: "internal" });
   return { token: client.tokenHandler.token!, refreshToken: client.tokenHandler.refreshToken! };
}

export async function connectVoice(client: HuginnClient, readyData?: GatewayReadyData): Promise<void> {
   const channel = readyData?.privateChannels[0];
   expect(channel).toBeDefined();

   const result = await client.voiceManager.connectVoice(null, channel!.id);
   expect(result).toBeTrue();
}

export async function getConnectedClient(login: boolean): Promise<HuginnClient> {
   const client = getClient();

   if (login) {
      await loginClient(client);
   }

   client.gateway.connect();
   await client.gateway.waitForEvents(["hello"]);

   expect(client.gateway.status).toBe("connected");

   return client;
}

export async function getAuthenticatedClient(): Promise<{
   client: HuginnClient;
   readyData?: GatewayReadyData;
}> {
   const client = await getConnectedClient(true);
   let readyData: GatewayReadyData | undefined;

   const unlisten = client.gateway.listen("ready", (d) => {
      readyData = d;
      unlisten();
   });

   await client.gateway.authenticate();

   expect(client.gateway.status).toBe("authenticated");

   return { client, readyData };
}

let timesDoneCalled = 0;
export function multiDone(done: (err?: unknown) => void, amount: number): () => void {
   function tryDone() {
      timesDoneCalled++;

      if (timesDoneCalled === amount) {
         done();
         timesDoneCalled = 0;
      }
   }

   return tryDone;
}
