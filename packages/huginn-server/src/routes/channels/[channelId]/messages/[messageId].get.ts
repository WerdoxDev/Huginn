import { createRoute, missingAccess } from "@huginn/backend-shared";
import { type APIGetMessageByIdResult, HttpCode, idFix, nullToUndefined } from "@huginn/shared";
import { prisma } from "#database";
import { selectMessageDefaults } from "#database/common";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/channels/:channelId/messages/:messageId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId, messageId } = c.req.param();

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(c);
	}

	const dbMessage = idFix(await prisma.message.getById(channelId, messageId, { select: selectMessageDefaults }));
	const message: APIGetMessageByIdResult = {
		...dbMessage,
		embeds: nullToUndefined(dbMessage.embeds),
		attachments: nullToUndefined(dbMessage.attachments),
	};

	return c.json(message, HttpCode.OK);
});
