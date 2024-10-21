import { useValidatedParams } from "@huginn/backend-shared";
import { type APIGetUserRelationshipByIdResult, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeRelationshipUser, omitRelationshipUserIds } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ userId: z.string() });

router.get(
	"/users/@me/relationships/:userId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const userId = (await useValidatedParams(event, schema)).userId;

		const relationship: APIGetUserRelationshipByIdResult = idFix(
			await prisma.relationship.getByUserId(payload.id, userId, includeRelationshipUser, omitRelationshipUserIds),
		);

		setResponseStatus(event, HttpCode.OK);
		return relationship;
	}),
);
