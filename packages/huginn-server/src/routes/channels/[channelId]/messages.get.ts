import { createRoute, missingAccess, validator } from "@huginn/backend-shared";
import { type APIGetChannelMessagesResult, HttpCode, idFix, nullToUndefined } from "@huginn/shared";
import { z } from "zod";
import { prisma } from "#database";
import { selectMessageDefaults } from "#database/common";
import { envs } from "#setup";
import { getAttachmentUrl, verifyJwt } from "#utils/route-utils";

const querySchema = z.object({ limit: z.optional(z.string()), before: z.optional(z.string()), after: z.optional(z.string()) });

createRoute("GET", "/api/channels/:channelId/messages", verifyJwt(), validator("query", querySchema), async (c) => {
	const payload = c.get("tokenPayload");
	const query = c.req.valid("query");
	const { channelId } = c.req.param();
	const limit = Number(query.limit) || 50;
	const before = query.before;
	const after = query.after;

	const channel = idFix(await prisma.channel.getById(channelId, { select: { id: true } }));

	if (!(await prisma.user.hasChannel(payload.id, channel.id))) {
		return missingAccess(c);
	}

	const dbMessages = idFix(await prisma.message.getMessages(channelId, limit, before, after, { select: selectMessageDefaults }));
	const messages: APIGetChannelMessagesResult = dbMessages.map((x) => ({
		...x,
		embeds: nullToUndefined(x.embeds),
		attachments: nullToUndefined(x.attachments.map((x) => ({ ...x, url: getAttachmentUrl(x.url) }))),
	}));

	return c.json(messages, HttpCode.OK);
});
