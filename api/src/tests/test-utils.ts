import { LoginCredentials } from "@shared/api-types";
import { HuginnClient } from "..";

export const url = "192.168.178.51:3000";

export const testCredentials: LoginCredentials = {
   username: "test",
   email: "test@gmail.com",
   password: "test",
};

export const test2Credentials: LoginCredentials = {
   username: "test2",
   email: "test2@gmail.com",
   password: "test2",
};

export const test3Credentials: LoginCredentials = {
   username: "test3",
   email: "test3@gmail.com",
   password: "test3",
};

export const test4Credentials: LoginCredentials = {
   username: "test4",
   email: "test4@gmail.com",
   password: "test4",
};

export const editCredentials: LoginCredentials = {
   username: "test-edited",
   email: "test.edited@gmail.com",
   password: "test-edited",
};

export async function getLoggedClient(
   credentials: LoginCredentials = testCredentials,
   identifyGateway?: boolean
): Promise<HuginnClient> {
   const client = new HuginnClient({
      rest: { api: `http://${url}` },
      gateway: { url: `ws://${url}/gateway`, createSocket: (url) => new WebSocket(url), log: false, identify: identifyGateway },
   });

   await client.login(credentials);

   return client;
}

export function getNewClient(): HuginnClient {
   const client = new HuginnClient({
      rest: { api: `http://${url}` },
      gateway: { url: `ws://${url}/gateway`, createSocket: (url) => new WebSocket(url), log: false, identify: false },
   });
   return client;
}
