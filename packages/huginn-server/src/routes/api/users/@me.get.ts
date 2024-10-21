import { type APIGetCurrentUserResult, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { prisma } from "#database";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

router.get(
	"/users/@me",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);

		const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id));

		setResponseStatus(event, HttpCode.OK);
		return user;
	}),
);
