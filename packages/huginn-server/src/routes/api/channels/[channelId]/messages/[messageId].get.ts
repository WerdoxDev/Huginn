import { missingAccess, unauthorized, useValidatedParams } from "@huginn/backend-shared";
import { type APIGetMessageByIdResult, HttpCode, idFix, merge, nullToUndefined, omit } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeMessageAuthor, includeMessageDefaultFields, includeMessageMentions, omitMessageAuthorId } from "#database/common";
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

		const dbMessage = idFix(await prisma.message.getById(channelId, messageId, includeMessageDefaultFields, omitMessageAuthorId));
		const message: APIGetMessageByIdResult = { ...dbMessage, embeds: nullToUndefined(dbMessage.embeds) };

		setResponseStatus(event, HttpCode.OK);
		return message;
	}),
);
