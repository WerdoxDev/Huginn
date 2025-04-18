import { createErrorFactory, createHuginnError, missingPermission, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { CDNRoutes, Errors, HttpCode, MessageFlags, MessageType, getFileHash, idFix, merge, toArrayBuffer } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { omitChannelRecipient, omitMessageAuthorId, selectChannelRecipients, selectMessageDefaults } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { channelWithoutRecipient, dispatchChannel, dispatchMessage } from "#utils/helpers";
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

		const channel = idFix(await prisma.channel.getById(channelId, { select: { name: true, icon: true, ownerId: true } }));

		if (body.owner && channel.ownerId !== payload.id) {
			return missingPermission(event);
		}

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

		const updatedChannel = idFix(
			await prisma.channel.editDM(channelId, body.name, channelIconHash, body.owner, { include: selectChannelRecipients }),
		);

		for (const recipient of updatedChannel.recipients) {
			dispatchChannel(updatedChannel, "channel_update", recipient.id);
		}

		if (channel.name !== updatedChannel.name) {
			await dispatchMessage(
				payload.id,
				channelId,
				MessageType.CHANNEL_NAME_CHANGED,
				updatedChannel.name ?? "",
				undefined,
				undefined,
				MessageFlags.NONE,
			);
		}

		if (channel.icon !== updatedChannel.icon) {
			await dispatchMessage(payload.id, channelId, MessageType.CHANNEL_ICON_CHANGED, "", undefined, undefined, MessageFlags.NONE);
		}

		if (channel.ownerId !== updatedChannel.ownerId) {
			await dispatchMessage(
				payload.id,
				channelId,
				MessageType.CHANNEL_OWNER_CHANGED,
				"",
				undefined,
				[updatedChannel.ownerId || ""],
				MessageFlags.NONE,
			);
		}

		setResponseStatus(event, HttpCode.OK);
		return channelWithoutRecipient(updatedChannel, payload.id);
	}),
);
