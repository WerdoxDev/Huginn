import { afterAll, afterEach, beforeAll } from "bun:test";
import { disconnectWebSockets, removeChannels, removeUsers, timeSpent } from "./utils";
import { prepareServer } from "@huginn/backend-shared";

beforeAll(async () => {
   await prepareServer("http://localhost:3004");
});

afterEach(() => {
   disconnectWebSockets();
});

afterAll(async () => {
   console.log("START CLEANUP");
   try {
      await removeChannels();
      await removeUsers();
   } catch (e) {
      console.error(e);
   }
   console.log("END CLEANUP");
   console.log(timeSpent);
});
