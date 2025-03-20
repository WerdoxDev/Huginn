import { createRoute, missingAccess } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIGetChannelByIdResult, ChannelType, HttpCode, idFix, merge, omit } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/channels/:channelId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId } = c.req.param();

	const channel: APIGetChannelByIdResult = idFix(
		await prisma.channel.getById(channelId, { include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }),
	);

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(c);
	}

	let finalChannel: APIGetChannelByIdResult;

	if (channel.type === ChannelType.DM) {
		finalChannel = omit(channel, ["icon", "name", "ownerId"]);
	} else {
		finalChannel = channel;
	}

	return c.json(finalChannel, HttpCode.OK);
});
