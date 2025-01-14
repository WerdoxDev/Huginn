import { type APIGetUserRelationshipsResult, HttpCode, idFix, omitArray } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { prisma } from "#database";
import { omitRelationshipUserIds, selectRelationshipUser } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

router.get(
	"/users/@me/relationships",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);

		const relationships: APIGetUserRelationshipsResult = idFix(
			await prisma.relationship.getUserRelationships(payload.id, { include: selectRelationshipUser, omit: omitRelationshipUserIds }),
		);

		setResponseStatus(event, HttpCode.OK);
		return relationships;
	}),
);
