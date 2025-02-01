import { createRoute } from "@huginn/backend-shared";
import { type APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";
import { prisma } from "#database";
import { selectPrivateUser } from "#database/common";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/@me", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");

	const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));

	return c.json(user, HttpCode.OK);
});
