import { type APIGetUserChannelsResult, HttpCode, idFix, merge } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { prisma } from "#database";
import { excludeChannelRecipient, includeChannelRecipients } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

router.get(
	"/users/@me/channels",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);

		const channels: APIGetUserChannelsResult = idFix(
			await prisma.channel.getUserChannels(payload.id, false, merge(includeChannelRecipients, excludeChannelRecipient(payload.id))),
		);

		setResponseStatus(event, HttpCode.OK);
		return channels;
	}),
);
