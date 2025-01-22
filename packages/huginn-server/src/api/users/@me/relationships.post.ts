import { catchError, createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { DBErrorType } from "@huginn/backend-shared/types";
import { Errors, HttpCode, RelationshipType, type Snowflake, idFix, omit } from "@huginn/shared";
import type { H3Event } from "h3";
import type { NitroApp } from "nitropack/types";
import { z } from "zod";
import { assertError, prisma } from "#database";
import { selectRelationshipUser } from "#database/common";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ username: z.string() });

export default defineEventHandler(async (event) => {
	const body = await useValidatedBody(event, schema);

	if (!body.username) {
		return createHuginnError(event, createErrorFactory(Errors.invalidFormBody()));
	}

	const [error, userId] = await catchError(async () => idFix(await prisma.user.getByUsername(body.username)).id);

	if (assertError(error, DBErrorType.NULL_USER)) {
		return createHuginnError(event, createErrorFactory(Errors.noUserWithUsername()), HttpCode.NOT_FOUND);
	}
	if (error) throw error;

	return relationshipPost(event, userId);
});

export async function relationshipPost(event: H3Event, userId: Snowflake) {
	const { payload } = await useVerifiedJwt(event);

	if (userId === payload.id) {
		return createHuginnError(event, createErrorFactory(Errors.relationshipSelfRequest()), HttpCode.BAD_REQUEST);
	}

	if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
		return createHuginnError(event, createErrorFactory(Errors.relationshipExists()), HttpCode.BAD_REQUEST);
	}

	if (
		!(await prisma.relationship.exists({
			ownerId: BigInt(payload.id),
			userId: BigInt(userId),
			type: RelationshipType.PENDING_OUTGOING,
		}))
	) {
		const relationships = idFix(
			await prisma.relationship.createRelationship(payload.id, userId, { include: { ...selectRelationshipUser }, omit: { userId: true } }),
		);

		const relationshipOwner = relationships.find((x) => x.ownerId === payload.id);
		const relationshipUser = relationships.find((x) => x.ownerId === userId);

		if (relationshipOwner && relationshipUser) {
			dispatchToTopic(payload.id, "relationship_add", omit(relationshipOwner, ["ownerId"]));
			dispatchToTopic(userId, "relationship_add", omit(relationshipUser, ["ownerId"]));

			gateway.subscribeSessionsToTopic(payload.id, `${userId}_public`);
			gateway.subscribeSessionsToTopic(userId, `${payload.id}_public`);

			if (relationshipOwner.type === RelationshipType.FRIEND && relationshipUser.type === RelationshipType.FRIEND) {
				gateway.subscribeSessionsToTopic(payload.id, `${userId}_presence`);
				gateway.subscribeSessionsToTopic(userId, `${payload.id}_presence`);

				gateway.presenceManeger.sendToUser(payload.id, userId);
				gateway.presenceManeger.sendToUser(userId, payload.id);
			}
		}
	}

	return sendNoContent(event, HttpCode.NO_CONTENT);
}
