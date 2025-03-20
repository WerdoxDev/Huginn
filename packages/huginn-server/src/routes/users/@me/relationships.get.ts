import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitRelationshipUserIds, selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { type APIGetUserRelationshipsResult, HttpCode, idFix } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/@me/relationships", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");

	const relationships: APIGetUserRelationshipsResult = idFix(
		await prisma.relationship.getUserRelationships(payload.id, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
	);

	return c.json(relationships, HttpCode.OK);
});
