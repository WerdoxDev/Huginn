import { missingAccess, unauthorized, useValidatedParams } from "@huginn/backend-shared";
import { type APIGetMessageByIdResult, HttpCode, idFix, merge, nullToUndefined, omit } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitMessageAuthorId, selectMessageAuthor, selectMessageDefaults, selectMessageMentions } from "#database/common";

import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), messageId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const { channelId, messageId } = await useValidatedParams(event, schema);

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(event);
	}

	const dbMessage = idFix(await prisma.message.getById(channelId, messageId, { select: selectMessageDefaults }));
	const message: APIGetMessageByIdResult = { ...dbMessage, embeds: nullToUndefined(dbMessage.embeds) };

	setResponseStatus(event, HttpCode.OK);
	return message;
});
