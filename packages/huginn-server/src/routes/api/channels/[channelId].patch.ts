import { createErrorFactory, createHuginnError, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { CDNRoutes, Errors, HttpCode, MessageFlags, MessageType, getFileHash, idFix, merge, toArrayBuffer } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { excludeChannelRecipient, includeChannelRecipients, includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import { validateChannelName } from "#utils/validation";

const schema = z.object({
	name: z.optional(z.nullable(z.string())),
	icon: z.optional(z.nullable(z.string())),
	owner: z.optional(z.string()),
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

		const channel = await prisma.channel.getById(channelId);

		let channelIconHash: string | undefined | null = undefined;
		if (body.icon !== null && body.icon !== undefined) {
			const data = toArrayBuffer(body.icon);
			channelIconHash = getFileHash(data);

			channelIconHash = (
				await cdnUpload<string>(CDNRoutes.uploadChannelIcon(channelId), {
					files: [{ data: data, name: channelIconHash }],
				})
			).split(".")[0];
		} else if (body.icon === null) {
			channelIconHash = null;
		}

		const updatedChannel = idFix(await prisma.channel.editDM(channelId, { name: body.name, icon: channelIconHash }, includeChannelRecipients));

		for (const recipient of updatedChannel.recipients) {
			const channel = { ...updatedChannel, recipients: updatedChannel.recipients.filter((x) => x.id !== recipient.id) };
			dispatchToTopic(recipient.id, "channel_update", channel);
		}

		if (channel.name !== updatedChannel.name) {
			const message = idFix(
				await prisma.message.createDefaultMessage(
					payload.id,
					channelId,
					MessageType.CHANNEL_NAME_CHANGED,
					updatedChannel.name ?? "",
					undefined,
					undefined,
					MessageFlags.NONE,
					includeMessageAuthorAndMentions,
					omitMessageAuthorId,
				),
			);

			dispatchToTopic(channelId, "message_create", message);
		}

		setResponseStatus(event, HttpCode.OK);
		return { ...updatedChannel, recipients: updatedChannel.recipients.filter((x) => x.id !== payload.id) };
	}),
);
