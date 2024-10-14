import { createErrorFactory, createHuginnError, invalidFormBody, unauthorized, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { CDNRoutes, Errors, HttpCode, MessageType, idFix, merge, omit, resolveBuffer } from "@huginn/shared";
import { intersect } from "@std/collections";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { excludeChannelRecipient, includeChannelRecipients, includeMessageAuthorAndMentions } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { getFileHash, useVerifiedJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import { validateChannelName } from "#utils/validation";

const schema = z.object({
	name: z.optional(z.nullable(z.string())),
	icon: z.optional(z.nullable(z.string())),
});

const paramsSchema = z.object({ channelId: z.string() });

router.patch(
	"/channels/:channelId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, paramsSchema);
		const body = await useValidatedBody(event, schema);

		const formError = createErrorFactory(Errors.invalidFormBody());

		validateChannelName(body.name, formError);

		if (formError.hasErrors()) {
			return createHuginnError(event, formError);
		}

		let channelIconHash: string | undefined | null = undefined;
		if (body.icon !== null && body.icon !== undefined) {
			const data = resolveBuffer(body.icon);
			channelIconHash = getFileHash(data);

			channelIconHash = (
				await cdnUpload<string>(CDNRoutes.uploadChannelIcon(channelId), {
					files: [{ data: data, name: channelIconHash }],
				})
			).split(".")[0];
		} else if (body.icon === null) {
			channelIconHash = null;
		}

		const updatedChannel = idFix(
			await prisma.channel.editDM(
				payload.id,
				channelId,
				{ name: body.name, icon: channelIconHash },
				merge(includeChannelRecipients, excludeChannelRecipient(payload.id)),
			),
		);

		dispatchToTopic(channelId, "channel_update", updatedChannel);

		setResponseStatus(event, HttpCode.OK);
		return updatedChannel;
	}),
);
