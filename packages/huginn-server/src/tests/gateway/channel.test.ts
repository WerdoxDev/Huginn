import { describe, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { ChannelType } from "@huginn/shared";
import { expectChannelExactRecipients, expectChannelExactSchema, expectRecipientModifyExactSchema } from "#tests/expect-utils";
import {
	authHeader,
	createTestChannel,
	createTestRelationships,
	createTestUsers,
	getReadyWebSocket,
	multiDone,
	removeChannelLater,
	testIsDispatch,
} from "#tests/utils";

describe("Channel", () => {
	test(
		"should send channel_create when a user creates a type 0 (DM) channel",
		async (done) => {
			const [user, user2] = await createTestUsers(2);

			await createTestRelationships(user.id, user2.id, true);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const tryDone = multiDone(done, 1);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_create")) {
					expectChannelExactSchema(data.d, ChannelType.DM);
					expectChannelExactRecipients(data.d, [user2]);
					tryDone();
				}
			};

			await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", { recipients: [user2.id.toString()] }).then(
				removeChannelLater,
			);
		},
		{ timeout: 10000 },
	);

	test(
		"should send channel_create to all recipients when a user creates a type 1 (GROUP_DM) channel",
		async (done) => {
			const [user, user2, user3] = await createTestUsers(3);

			await createTestRelationships(user.id, user2.id, true);
			await createTestRelationships(user.id, user3.id, true);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const { ws: ws3 } = await getReadyWebSocket(user3);
			const tryDone = multiDone(done, 3);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_create")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, undefined, [user.id]);
					expectChannelExactRecipients(data.d, [user2, user3]);
					tryDone();
				}
			};

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_create")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, undefined, [user.id]);
					expectChannelExactRecipients(data.d, [user, user3]);
					tryDone();
				}
			};

			ws3.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_create")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, undefined, [user.id]);
					expectChannelExactRecipients(data.d, [user, user2]);
					tryDone();
				}
			};

			await testHandler("/api/users/@me/channels", authHeader(user.accessToken), "POST", {
				recipients: [user2.id.toString(), user3.id.toString()],
			}).then(removeChannelLater);
		},
		{ timeout: 10000 },
	);

	test(
		"should send channel_delete when the user closes or leaves a channel",
		async (done) => {
			const [user, user2, user3] = await createTestUsers(3);

			await createTestRelationships(user.id, user2.id, true);
			await createTestRelationships(user.id, user3.id, true);

			const channel = await createTestChannel(undefined, ChannelType.DM, user.id, user2.id);
			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			const { ws: ws2 } = await getReadyWebSocket(user2);
			const tryDone = multiDone(done, 2);

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_delete")) {
					if (channel.id.toString() === data.d.id) {
						expectChannelExactSchema(data.d, ChannelType.DM, channel.id, undefined, undefined, undefined, true);
						tryDone();
					} else {
						expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user.id], undefined, undefined, true);
						tryDone();
					}
				}
			};

			await testHandler(`/api/channels/${channel.id}`, authHeader(user2.accessToken), "DELETE");
			await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user2.accessToken), "DELETE");
		},
		{ timeout: 10000 },
	);

	test(
		"should send channel_update when a type 1 (GROUP_DM) channel is edited",
		async (done) => {
			const [user, user2, user3] = await createTestUsers(3);

			await createTestRelationships(user.id, user2.id, true);
			await createTestRelationships(user.id, user3.id, true);

			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const { ws: ws3 } = await getReadyWebSocket(user3);
			const tryDone = multiDone(done, 3);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_update")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user2.id], "test-edited", undefined);
					expectChannelExactRecipients(data.d, [user2, user3]);
					tryDone();
				}
			};

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_update")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user2.id], "test-edited", undefined);
					expectChannelExactRecipients(data.d, [user, user3]);
					tryDone();
				}
			};

			ws3.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_update")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user2.id], "test-edited", undefined);
					expectChannelExactRecipients(data.d, [user, user2]);
					tryDone();
				}
			};

			await testHandler(`/api/channels/${groupChannel.id}`, authHeader(user.accessToken), "PATCH", {
				name: "test-edited",
				owner: user2.id.toString(),
			});
		},
		{ timeout: 10000 },
	);

	test(
		"should send channel_recipient_add when a user is added to a type 1 (GROUP_DM) channel and channel_create to the user that was added",
		async (done) => {
			const [user, user2, user3] = await createTestUsers(3);

			await createTestRelationships(user.id, user2.id, true);
			await createTestRelationships(user.id, user3.id, true);

			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const { ws: ws3 } = await getReadyWebSocket(user3);
			const tryDone = multiDone(done, 3);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_recipient_add")) {
					expectRecipientModifyExactSchema(data.d, groupChannel.id, user3);
					tryDone();
				}
			};

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_recipient_add")) {
					expectRecipientModifyExactSchema(data.d, groupChannel.id, user3);
					tryDone();
				}
			};

			ws3.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_create")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user.id]);
					expectChannelExactRecipients(data.d, [user, user2]);
					tryDone();
				}
			};

			await testHandler(`/api/channels/${groupChannel.id}/recipients/${user3.id}`, authHeader(user.accessToken), "PUT");
		},
		{ timeout: 10000 },
	);

	test(
		"should send channel_recipient_remove when a user is removed from a type 1 (GROUP_DM) channel and channel_delete to the user that was removed",
		async (done) => {
			const [user, user2, user3] = await createTestUsers(3);

			await createTestRelationships(user.id, user2.id, true);
			await createTestRelationships(user.id, user3.id, true);

			const groupChannel = await createTestChannel(user.id, ChannelType.GROUP_DM, user.id, user2.id, user3.id);

			const { ws } = await getReadyWebSocket(user);
			const { ws: ws2 } = await getReadyWebSocket(user2);
			const { ws: ws3 } = await getReadyWebSocket(user3);
			const tryDone = multiDone(done, 3);

			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_recipient_remove")) {
					expectRecipientModifyExactSchema(data.d, groupChannel.id, user3);
					tryDone();
				}
			};

			ws2.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_recipient_remove")) {
					expectRecipientModifyExactSchema(data.d, groupChannel.id, user3);
					tryDone();
				}
			};

			ws3.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (testIsDispatch(data, "channel_delete")) {
					expectChannelExactSchema(data.d, ChannelType.GROUP_DM, groupChannel.id, [user.id], undefined, undefined, true);
					tryDone();
				}
			};

			await testHandler(`/api/channels/${groupChannel.id}/recipients/${user3.id}`, authHeader(user.accessToken), "DELETE");
		},
		{ timeout: 10000 },
	);
});
