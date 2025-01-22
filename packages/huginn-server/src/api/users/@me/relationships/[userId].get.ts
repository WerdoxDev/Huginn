import { useValidatedParams } from "@huginn/backend-shared";
import { type APIGetUserRelationshipByIdResult, HttpCode, idFix } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitRelationshipUserIds, selectRelationshipUser } from "#database/common";

import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ userId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const userId = (await useValidatedParams(event, schema)).userId;

	const relationship: APIGetUserRelationshipByIdResult = idFix(
		await prisma.relationship.getByUserId(payload.id, userId, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
	);

	setResponseStatus(event, HttpCode.OK);
	return relationship;
});
