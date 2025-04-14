import { prisma } from "@huginn/backend-shared/database";
import { selectCallMessage, selectMessageDefaults } from "@huginn/backend-shared/database/common";
import { type DirectChannel, type GatewayEvents, type MessageType, type Snowflake, idFix } from "@huginn/shared";
import { dispatchToTopic } from "./gateway-utils";

export async function dispatchMessage(
	authorId: Snowflake,
	channelId: Snowflake,
	type: MessageType,
	content?: string,
	mentions?: Snowflake[],
	flags?: number,
	callParticipants?: Snowflake[],
) {
	const message = idFix(
		await prisma.message.createMessage(undefined, authorId, channelId, type, content, undefined, undefined, mentions, flags, callParticipants, {
			select: callParticipants && callParticipants.length !== 0 ? selectCallMessage : selectMessageDefaults,
		}),
	);

	dispatchToTopic(channelId, "message_create", { ...message, embeds: [], attachments: [] });

	return message;
}

export function channelWithoutRecipient(channel: DirectChannel, recipientId: Snowflake) {
	return { ...channel, recipients: channel.recipients.filter((x) => x.id !== recipientId) };
}

export function dispatchChannel(
	channel: DirectChannel,
	topic: keyof Pick<GatewayEvents, "channel_create" | "channel_update" | "channel_delete">,
	userId: Snowflake,
) {
	dispatchToTopic(userId, topic, channelWithoutRecipient(channel, userId));
}
