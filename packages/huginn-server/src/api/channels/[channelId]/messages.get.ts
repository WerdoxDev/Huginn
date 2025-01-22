import { missingAccess, useValidatedParams, useValidatedQuery } from "@huginn/backend-shared";
import { type APIGetChannelByIdResult, type APIGetChannelMessagesResult, HttpCode, idFix, nullToUndefined, omitArray } from "@huginn/shared";

import { z } from "zod";
import { prisma } from "#database";
import { omitMessageAuthorId, selectMessageDefaults } from "#database/common";

import { useVerifiedJwt } from "#utils/route-utils";

const querySchema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });
const paramsSchema = z.object({ channelId: z.string() });

export default defineEventHandler(async (event) => {
	const { payload } = await useVerifiedJwt(event);
	const query = await useValidatedQuery(event, querySchema);
	const channelId = (await useValidatedParams(event, paramsSchema)).channelId;
	const limit = Number(query.limit) || 50;
	const before = query.before;
	const after = query.after;

	const channel = idFix(await prisma.channel.getById(channelId, { select: { id: true } }));

	if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
		return missingAccess(event);
	}

	const dbMessages = idFix(await prisma.message.getMessages(channelId, limit, before, after, { select: selectMessageDefaults }));
	const messages: APIGetChannelMessagesResult = dbMessages.map((x) => ({ ...x, embeds: nullToUndefined(x.embeds) }));

	setResponseStatus(event, HttpCode.OK);
	return messages;
});
