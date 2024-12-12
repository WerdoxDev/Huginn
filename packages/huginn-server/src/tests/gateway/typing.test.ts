import { describe, test } from "bun:test";
import { ChannelType } from "@huginn/shared";
import { expectTypingExactSchema } from "#tests/expect-utils";
import { authHeader, createTestChannel, createTestUsers, getReadyWebSocket, multiDone, testHandler, testIsDispatch } from "#tests/utils";

describe("Typing", () => {
	test(
		"should send typing_start to others when a user in a channel starts typing",
		async (done) => {
			const [user, user2] = await createTestUsers(2);

			const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const tryDone = multiDone(done, 2);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "typying_start")) {
					expectTypingExactSchema(data.d, channel.id, user2.id);
					tryDone();
				}
			};

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "typying_start")) {
					expectTypingExactSchema(data.d, channel.id, user.id);
					tryDone();
				}
			};

			await testHandler(`/api/channels/${channel.id}/typing`, authHeader(user2.accessToken), "POST");
			await testHandler(`/api/channels/${channel.id}/typing`, authHeader(user.accessToken), "POST");
		},
		{ timeout: 10000 },
	);
});
