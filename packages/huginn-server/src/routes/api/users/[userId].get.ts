import { useValidatedParams } from "@huginn/backend-shared";
import { type APIGetUserByIdResult, HttpCode, idFix, omit } from "@huginn/shared";
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

		const user: APIGetUserByIdResult = idFix(await prisma.user.getById(userId, undefined, selectPublicUser));

		setResponseStatus(event, HttpCode.OK);
		return user;
	}),
);
