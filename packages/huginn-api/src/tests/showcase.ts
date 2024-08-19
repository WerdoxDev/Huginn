import { HuginnClient } from "../client/huginn-client";

const client = new HuginnClient();

// Logging in using normal credentials
await client.login({ email: "test@gmail.com", password: "test123" });

// Creating a message in a channel
await client.channels.createMessage("1234", { content: "HELLO!" });
//                               ^
//                           Channel Id

// Adding a user as a friend
await client.relationships.createRelationship({ username: "other_test" });

// Listening for sent messages
client.gateway.on("message_create", event => {
   console.log(event.channelId, event.content, event.author.id);
});

await client.logout();
