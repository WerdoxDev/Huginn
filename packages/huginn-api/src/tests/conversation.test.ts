import { ChannelType } from "@huginn/shared";
import { beforeAll, describe, it } from "@std/testing/bdd";
import { url, getLoggedClient, test2Credentials } from "./test-utils.ts";

beforeAll(async () => {
	await fetch(`http://${url}/test/conversation-messages`, { method: "POST" });
});

describe("conversation", () => {
	it("create-conversation", async () => {
		const client = await getLoggedClient();
		const secondClient = await getLoggedClient(test2Credentials);

		try {
			await client.users.edit({ displayName: "LokiFan92", password: "test" });
			await secondClient.users.edit({ displayName: "ThorEnthusiast", password: "test2" });
		} catch (e) {
			/* empty */
		}

		const channel = (await client.channels.getAll()).find((x) => x.type === ChannelType.DM);

		if (!channel) return;
		// const secondChannel = (await client.channels.getAll())[1];

		await client.channels.createMessage(channel.id, { content: "Hey! this is our first message!" });
		await client.channels.createMessage(channel.id, { content: "filling up space" });
		const suffixes = ["hmm", "hehe", ":)", ":>", ":P", ":O", ":]", ">:)", ":}", ":-)"];
		for (let i = 0; i < 50; i++) {
			const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
			await client.channels.createMessage(channel.id, { content: `filling up space... ${suffix}` });
		}

		await client.channels.createMessage(channel.id, {
			content: "Hey ThorEnthusiast! Did you know **Odin** is called the All-Father?",
		});
		await secondClient.channels.createMessage(channel.id, { content: "Yeah, _he even sacrificed an eye for wisdom!_" });
		await client.channels.createMessage(channel.id, { content: "One of my faves. Have you heard about **Tyr** and **Fenrir**?" });
		await secondClient.channels.createMessage(channel.id, { content: "You mean where ||Fenrir bites off|| Tyr's hand?" });
		await client.channels.createMessage(channel.id, { content: "Norse myths are so deep and dramatic." });
		await secondClient.channels.createMessage(channel.id, { content: "Yes! We should discuss more myths soon." });
		await client.channels.createMessage(channel.id, { content: "Definitely. Catch you later!" });
		await secondClient.channels.createMessage(channel.id, { content: "See you!" });

		// await client.channels.createMessage(secondChannel.id, { content: "Emam zaman" });
		// await secondClient.channels.createMessage(secondChannel.id, { content: "Janam?" });
		// await client.channels.createMessage(secondChannel.id, { content: "Be darya raftam mahi nabood :(" });
		// await secondClient.channels.createMessage(secondChannel.id, { content: "Namaze sobh ra khandei?" });
		// await client.channels.createMessage(secondChannel.id, { content: "Na..." });
		// await secondClient.channels.createMessage(secondChannel.id, { content: "goh khordi" });
	});
});
