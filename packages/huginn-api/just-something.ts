import { snowflake, WorkerID } from "@huginn/shared";

import { HuginnClient } from "./src";

// const ids = new Set<string>();

// for (let i = 0; i < 100; i++) {
//    ids.add(snowflake.generate(WorkerID.MESSAGE).toString());
// }

// console.log(ids.size);

const client = new HuginnClient({
   rest: {
      api: "http://localhost:3004/api",
   },
   gateway: {
      url: "ws://localhost:3004/gateway",
      createSocket(url) {
         return new WebSocket(url);
      },
   },
});

await client.login({ username: "user2", password: "user2" });
console.log("Logged in");
const channelId = "422833008056340480";

const promises = [];
for (let i = 0; i < 20; i++) {
   promises.push(client.channels.createMessage(channelId, { content: `GAGA ${i}` }).then((x) => console.log(x)));
}

await Promise.all(promises);
