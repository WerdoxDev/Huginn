import { router } from "#server";
import { prisma } from "#database";
import { type APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";
import { useVerifiedJwt } from "#utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";

router.get(
	"/users/@me",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);

		const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id));

		setResponseStatus(event, HttpCode.OK);
		return user;
	}),
);
