import { createRoute, missingAccess } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIDeleteDMChannelResult, ChannelType, HttpCode, MessageFlags, MessageType, idFix, merge, omit } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { dispatchChannel, dispatchMessage } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";

createRoute("DELETE", "/api/channels/:channelId", verifyJwt(), async (c) => {
	const payload = c.get("tokenPayload");
	const { channelId } = c.req.param();

	const channel = idFix(await prisma.channel.getById(channelId, { select: { ...selectChannelRecipients, type: true, ownerId: true } }));

	if (!(await prisma.user.hasChannel(payload.id, channelId))) {
		return missingAccess(c);
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
		await dispatchMessage(payload.id, channelId, MessageType.RECIPIENT_REMOVE, "", undefined, MessageFlags.NONE);
	}

	return c.json(deletedChannel, HttpCode.OK);
});
