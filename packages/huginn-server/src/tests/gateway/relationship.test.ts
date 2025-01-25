import { describe, expect, test } from "bun:test";
import { testHandler } from "@huginn/backend-shared";
import { RelationshipType } from "@huginn/shared";
import { expectRelationshipExactSchema } from "#tests/expect-utils";
import { authHeader, createTestRelationships, createTestUsers, getReadyWebSocket, multiDone, testIsDispatch } from "#tests/utils";

describe("Relationship", () => {
	test("should send a relationship_add when a relationship is made with the user", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const tryDone = multiDone(done, 2);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_add")) {
				expectRelationshipExactSchema(data.d, RelationshipType.PENDING_OUTGOING, undefined, user2);
				tryDone();
			}
		};

		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_add")) {
				expectRelationshipExactSchema(data.d, RelationshipType.PENDING_INCOMING, undefined, user);
				tryDone();
			}
		};

		await testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "PUT");
	});

	test("should send a relationship_remove when a relationship is removed with a user", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		await createTestRelationships(user.id, user2.id, true);

		const tryDone = multiDone(done, 2);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_remove")) {
				expect(data.d).toBe(user2.id.toString());
				tryDone();
			}
		};

		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_remove")) {
				expect(data.d).toBe(user.id.toString());
				tryDone();
			}
		};

		await testHandler(`/api/users/@me/relationships/${user2.id}`, authHeader(user.accessToken), "DELETE");
	});

	test("should send a relationship_add when a type 3 or 4 (PENDING_INCOMING, PENDING_OUTGOING) is converted to type 1 (friend)", async (done) => {
		const [user, user2] = await createTestUsers(2);

		const { ws } = await getReadyWebSocket(user);
		const { ws: ws2 } = await getReadyWebSocket(user2);
		const [relationship, relationship2] = await createTestRelationships(user.id, user2.id, false);

		const tryDone = multiDone(done, 2);

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_add")) {
				expectRelationshipExactSchema(data.d, RelationshipType.FRIEND, relationship.id, user2);
				tryDone();
			}
		};

		ws2.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (testIsDispatch(data, "relationship_add")) {
				expectRelationshipExactSchema(data.d, RelationshipType.FRIEND, relationship2.id, user);
				tryDone();
			}
		};

		await testHandler(`/api/users/@me/relationships/${user.id}`, authHeader(user2.accessToken), "PUT");
	});
});
