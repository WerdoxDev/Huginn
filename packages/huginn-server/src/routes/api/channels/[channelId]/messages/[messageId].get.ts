import { missingAccess, unauthorized, useValidatedParams } from "@huginn/backend-shared";
import { type APIGetMessageByIdResult, HttpCode, idFix, merge, omit } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeMessageAuthor, includeMessageMentions, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), messageId: z.string() });

router.get(
	"/channels/:channelId/messages/:messageId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId, messageId } = await useValidatedParams(event, schema);

		if (!(await prisma.user.hasChannel(payload.id, channelId))) {
			return missingAccess(event);
		}

		const message: APIGetMessageByIdResult = idFix(
			await prisma.message.getById(channelId, messageId, merge(includeMessageAuthor, includeMessageMentions), omitMessageAuthorId),
		);

		setResponseStatus(event, HttpCode.OK);
		return message;
	}),
);
