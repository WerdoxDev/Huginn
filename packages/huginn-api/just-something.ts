import { HuginnClient } from "./src";

const client = new HuginnClient();

const _result = await client.initialize({ tokens: { token: "123" } });

client.gateway.on("message_create", async (d) => {
   if (d.channelId !== "321") return;

   if (d.content === "-help") {
      await client.channels.createMessage(d.channelId, { content: "yippie" });
   }
});
