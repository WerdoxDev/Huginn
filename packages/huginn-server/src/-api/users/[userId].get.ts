import { useValidatedParams } from "@huginn/backend-shared";
import { type APIPublicUser, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { selectPublicUser } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ userId: z.string() });

router.get(
	"/users/:userId",
	defineEventHandler(async (event) => {
		await useVerifiedJwt(event);
		const userId = (await useValidatedParams(event, schema)).userId;

		const user: APIPublicUser = idFix(await prisma.user.getById(userId, { select: selectPublicUser }));

		setResponseStatus(event, HttpCode.OK);
		return user;
	}),
);
