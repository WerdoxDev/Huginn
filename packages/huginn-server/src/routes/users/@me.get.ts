import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { type APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/@me", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");

	const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));

	return c.json(user, HttpCode.OK);
});
