import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitRelationshipUserIds, selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { type APIGetUserRelationshipByIdResult, HttpCode, idFix } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/@me/relationships/:userId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { userId } = c.req.param();

	const relationship: APIGetUserRelationshipByIdResult = idFix(
		await prisma.relationship.getByUserId(payload.id, userId, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
	);

	return c.json(relationship, HttpCode.OK);
});
