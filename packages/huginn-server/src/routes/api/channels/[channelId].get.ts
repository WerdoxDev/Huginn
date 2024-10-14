import { missingAccess, useValidatedParams } from "@huginn/backend-shared";
import { type APIGetChannelByIdResult, ChannelType, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients } from "#database/common";
import { router } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string() });

router.get(
	"/channels/:channelId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, schema);

		const channel: APIGetChannelByIdResult = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));

		if (!(await prisma.user.hasChannel(payload.id, channelId))) {
			return missingAccess(event);
		}

		setResponseStatus(event, HttpCode.OK);
		return channel;
	}),
);
