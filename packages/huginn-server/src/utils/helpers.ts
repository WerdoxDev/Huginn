import { type DirectChannel, type GatewayEvents, type MessageType, type Snowflake, idFix } from "@huginn/shared";
import { prisma } from "#database";
import { includeMessageAuthorAndMentions, omitMessageAuthorId } from "#database/common";
import { dispatchToTopic } from "./gateway-utils";

export async function dispatchMessage(
	authorId: Snowflake,
	channelId: Snowflake,
	type: MessageType,
	content?: string,
	attachments?: string[],
	mentions?: Snowflake[],
	flags?: number,
) {
	const message = idFix(
		await prisma.message.createDefaultMessage(
			authorId,
			channelId,
			type,
			content,
			attachments,
			mentions,
			flags,
			includeMessageAuthorAndMentions,
			omitMessageAuthorId,
		),
	);

	dispatchToTopic(channelId, "message_create", message);
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
