import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { expectPresenceExactSchema } from "#tests/expect-utils";
import {
	authHeader,
	createTestRelationships,
	createTestUsers,
	getIdentifiedWebSocket,
	getReadyWebSocket,
	multiDone,
	testIsDispatch,
} from "#tests/utils";

describe("Presence", () => {
	test("should send relationship presences with the websocket ready message", async (done) => {
		const [user, user2] = await createTestUsers(2);
		// FRIEND Relationship between user and user2
		await createTestRelationships(user.id, user2.id, true);

		// Fully connect user2
		const { ws: ws2 } = await getReadyWebSocket(user2);

		const { ws } = await getIdentifiedWebSocket(user);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "ready")) {
				// user2's presence should be sent to user
				expect(data.d.presences).toHaveLength(1);
				expectPresenceExactSchema(data.d.presences[0], user2, "online");
				done();
			}
		};
	});

	test("should send a presence_update when a related user gets online", async (done) => {
		const [user, user2] = await createTestUsers(2);
		// FRIEND Relationship between user and user2
		await createTestRelationships(user.id, user2.id, true);

		// Fully connect user
		const { ws } = await getReadyWebSocket(user);

		// Listen to presence_update
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update")) {
				// user2's presence should be sent to user
				expectPresenceExactSchema(data.d, user2, "online");
				done();
			}
		};

		// Fully connect user2
		const { ws: ws2 } = await getReadyWebSocket(user2);
	});

	test("should send an offline presence_update when a related user gets offline", async (done) => {
		const [user, user2] = await createTestUsers(2);
		// FRIEND Relationship between user and user2
		await createTestRelationships(user.id, user2.id, true);

		// Fully connect user
		const { ws } = await getReadyWebSocket(user);
		// Fully connect user2
		const { ws: ws2 } = await getReadyWebSocket(user2);

		// Listen to presence_update
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update") && data.d.status === "offline") {
				// user2's presence should be sent to user
				expectPresenceExactSchema(data.d, user2, "offline");
				done();
			}
		};

		ws2.close();
	});

	test("should send an presence_update to both users when they accept eachother as friends", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		await createTestRelationships(user.id, user2.id, false);

		const tryDone = multiDone(done, 2);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update")) {
				expectPresenceExactSchema(data.d, user2, "online");
				tryDone();
			}
		};

		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update")) {
				expectPresenceExactSchema(data.d, user, "online");
				tryDone();
			}
		};

		await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(user2.accessToken), "PUT");
	});

	test("should send an offline presence_update to both users when they remove eachother as friends", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		await createTestRelationships(user.id, user2.id, true);

		const tryDone = multiDone(done, 2);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update")) {
				expectPresenceExactSchema(data.d, user2, "offline");
				tryDone();
			}
		};

		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "presence_update")) {
				expectPresenceExactSchema(data.d, user, "offline");
				tryDone();
			}
		};

		await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(user2.accessToken), "DELETE");
	});
});
