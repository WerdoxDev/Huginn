import { missingAccess, useValidatedParams } from "@huginn/backend-shared";
import { type APIDeleteDMChannelResult, ChannelType, HttpCode, MessageFlags, MessageType, idFix, merge, omit } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { omitChannelRecipient, selectChannelRecipients } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";
import { useVerifiedJwt } from "#utils/route-utils";

const schema = z.object({ channelId: z.string() });

router.delete(
	"/channels/:channelId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, schema);

		const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } }));

		if (!(await prisma.user.hasChannel(payload.id, channelId))) {
			return missingAccess(event);
		}

		// Transfer the old owner to a new one alphabetically
		if (channel.ownerId === payload.id) {
			const updatedChannel = idFix(
				await prisma.channel.editDM(
					channelId,
					undefined,
					undefined,
					channel.recipients.filter((x) => x.id !== payload.id).toSorted((a, b) => (a.username > b.username ? 1 : -1))[0].id,
					{ include: selectChannelRecipients },
				),
			);

			for (const recipient of updatedChannel.recipients) {
				dispatchChannel(updatedChannel, "channel_update", recipient.id);
			}
		}

		// Delete or leave the DM
		const deletedChannel: APIDeleteDMChannelResult = idFix(
			await prisma.channel.deleteDM(channelId, payload.id, { include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)) }),
		);

		// Delete read state
		await prisma.readState.deleteState(payload.id, deletedChannel.id);

		// Dispatch channel delete event
		dispatchToTopic(payload.id, "channel_delete", omit(deletedChannel, ["recipients"]));

		// Dispatch channel recipient remove event
		const removedRecipient = channel.recipients.find((x) => x.id === payload.id);
		if (channel.type === ChannelType.GROUP_DM && removedRecipient) {
			dispatchToTopic(channelId, "channel_recipient_remove", { channelId: channelId, user: removedRecipient });
			gateway.unsubscribeSessionsFromTopic(payload.id, channelId);
		}

		// Send a recipient remove message in group dm
		if (channel.type === ChannelType.GROUP_DM) {
			await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_REMOVE, "", undefined, undefined, MessageFlags.NONE);
		}

		setResponseStatus(event, HttpCode.OK);
		return deletedChannel;
	}),
);
