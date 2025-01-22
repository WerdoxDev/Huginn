import { type APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";

import { prisma } from "#database";
import { selectPrivateUser } from "#database/common";

import { useVerifiedJwt } from "#utils/route-utils";

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);

	const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id, { select: selectPrivateUser }));

	setResponseStatus(event, HttpCode.OK);
	return user;
});
