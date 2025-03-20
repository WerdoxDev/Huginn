import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIGetUserChannelsResult, HttpCode, idFix, merge } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/@me/channels", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");

	const channels: APIGetUserChannelsResult = idFix(
		await prisma.channel.getUserChannels(payload.id, false, { include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }),
	);

	return c.json(channels, HttpCode.OK);
});
