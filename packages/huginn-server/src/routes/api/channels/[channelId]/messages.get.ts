import { missingAccess, useValidatedParams, useValidatedQuery } from "@huginn/backend-shared";
import { type APIGetChannelByIdResult, type APIGetChannelMessagesResult, HttpCode, idFix, omitArray } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const querySchema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });
const paramsSchema = z.object({ channelId: z.string() });

router.get(
	"/channels/:channelId/messages",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const query = await useValidatedQuery(event, querySchema);
		const channelId = (await useValidatedParams(event, paramsSchema)).channelId;
		const limit = Number(query.limit) || 50;
		const before = query.before;
		const after = query.after;

		const channel = idFix(await prisma.channel.getById(channelId, undefined, { id: true }));

		if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
			return missingAccess(event);
		}

		const messages: APIGetChannelMessagesResult = idFix(
			await prisma.message.getMessages(channelId, limit, before, after, includeMessageAuthorAndMentions, omitMessageAuthorId),
		);

		setResponseStatus(event, HttpCode.OK);
		return messages;
	}),
);
