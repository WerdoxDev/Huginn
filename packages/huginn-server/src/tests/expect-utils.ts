import { expect } from "bun:test";
import {
	type APIAttachment,
	type APIChannelUser,
	type APIEmbed,
	type APIMessage,
	type APIMessageUser,
	type APIPostDMChannelResult,
	type APIPublicUser,
	type APIReadState,
	type APIRelationUser,
	type APIRelationshipWithoutOwner,
	type APIThumbnail,
	type APIVideo,
	ChannelType,
	type DirectChannel,
	type GatewayDMCHannelRecipientAddData,
	type GatewayDMCHannelRecipientRemoveData,
	type GatewayTypingStartData,
	MessageType,
	type PresenceStatus,
	RelationshipType,
	type Snowflake,
	type UserPresence,
} from "@huginn/shared";
import { type TestUser, containsId } from "./utils";

export function expectPrivateUserExactSchema(user: object) {
	expect(Object.keys(user).sort()).toStrictEqual(
		["id", "username", "displayName", "password", "email", "avatar", "flags", "token", "refreshToken"].sort(),
	);
}

export function expectUserExactSchema(
	user: object,
	id?: bigint,
	username?: string,
	displayName?: string | null,
	avatar?: string | null,
	flags?: number,
	email?: string,
	password?: string | null,
	hasTokens?: boolean,
) {
	const castedUser = user as APIPublicUser;

	expect(Object.keys(user).sort()).toStrictEqual(
		[
			"id",
			"username",
			"displayName",
			"avatar",
			"flags",
			...(email ? ["email"] : []),
			...(password ? ["password"] : []),
			...(hasTokens ? ["token", "refreshToken"] : []),
		].sort(),
	);
	expect(castedUser.displayName).toBe(displayName ? displayName : null);
	expect(castedUser.avatar).toBe(avatar ? avatar : null);

	if (id) expect(castedUser.id).toBe(id.toString());
	if (username) expect(castedUser.username).toBe(username);
	if (flags) expect(castedUser.flags).toBe(flags);
}

export function expectChannelExactSchema(
	channel: object,
	type: ChannelType,
	id?: bigint,
	ownerIds?: bigint[],
	name?: string,
	icon?: string,
	withoutRecipients?: boolean,
) {
	expect(channel).toHaveProperty("type", type);

	const castedChannel = channel as DirectChannel;
	let handled = false;

	if (id) expect(castedChannel.id).toBe(id.toString());

	if (type === ChannelType.DM) {
		expect(Object.keys(channel).sort()).toStrictEqual(
			withoutRecipients ? ["id", "lastMessageId", "type"].sort() : ["id", "lastMessageId", "recipients", "type"].sort(),
		);
		handled = true;
	}

	if (type === ChannelType.GROUP_DM) {
		expect(Object.keys(channel).sort()).toStrictEqual(
			withoutRecipients
				? ["id", "lastMessageId", "type", "icon", "name", "ownerId"].sort()
				: ["id", "lastMessageId", "recipients", "type", "icon", "name", "ownerId"].sort(),
		);
		if (ownerIds && castedChannel.ownerId) expect(ownerIds).toContain(BigInt(castedChannel.ownerId));
		expect(castedChannel.name).toBe(name ? name : null);
		expect(castedChannel.icon).toBe(icon ? icon : null);
		handled = true;
	}

	if (!withoutRecipients) {
		for (const recipient of (channel as APIPostDMChannelResult).recipients) {
			expect(Object.keys(recipient).sort()).toStrictEqual(["id", "username", "displayName", "flags", "avatar"].sort());
		}
	}

	expect(handled, `Channel with the type of ${type} was not handled`).toBeTrue();
}

export function expectChannelExactRecipients(channel: DirectChannel, recipients: (Omit<APIChannelUser, "id"> & { id: bigint })[]) {
	expect(
		channel.recipients.every((x) => recipients.some((y) => y.id.toString() === x.id)),
		"The returned channel recipients does not match the expected recipients",
	).toBeTrue();

	for (const user of recipients) {
		expect(containsId(channel.recipients, user.id.toString())).toBeTrue();

		const channelRecipient = channel.recipients.find((x) => x.id === user.id.toString());

		expect(channelRecipient).toEqual({
			id: user.id.toString(),
			flags: user.flags,
			username: user.username,
			displayName: user.displayName,
			avatar: user.avatar,
		} as APIChannelUser);
	}
}

export function expectMessageExactSchema(
	message: object,
	type: MessageType,
	id?: bigint,
	channelId?: bigint,
	author?: Omit<APIMessageUser, "id"> & { id: bigint },
	content?: string,
	mentions?: (Omit<APIMessageUser, "id"> & { id: bigint })[],
) {
	expect(message).toHaveProperty("type", type);

	const castedMessage = message as APIMessage;
	let handled = false;

	if (id) expect(castedMessage.id).toBe(id.toString());

	if (
		[
			MessageType.DEFAULT,
			MessageType.RECIPIENT_ADD,
			MessageType.RECIPIENT_REMOVE,
			MessageType.CHANNEL_ICON_CHANGED,
			MessageType.CHANNEL_NAME_CHANGED,
			MessageType.CHANNEL_OWNER_CHANGED,
		].includes(type)
	) {
		expect(Object.keys(message).sort()).toStrictEqual(
			[
				"id",
				"type",
				"channelId",
				"author",
				"content",
				"timestamp",
				"editedTimestamp",
				"embeds",
				"attachments",
				"pinned",
				"mentions",
				"reactions",
				"flags",
			].sort(),
		);

		if (channelId) expect(castedMessage.channelId).toBe(channelId.toString());
		if (content) expect(castedMessage.content).toBe(content);
		if (author) {
			expect(castedMessage.author).toStrictEqual({
				id: author.id.toString(),
				avatar: author.avatar,
				displayName: author.displayName,
				username: author.username,
				flags: author.flags,
			});
		}
		if (mentions) {
			expect(castedMessage.mentions.sort()).toStrictEqual(
				mentions.map((x) => ({ id: x.id.toString(), avatar: x.avatar, displayName: x.displayName, flags: x.flags, username: x.username })).sort(),
			);
		}
		expect(Object.keys(castedMessage.author).sort()).toStrictEqual(["id", "username", "displayName", "flags", "avatar"].sort());

		handled = true;
	}

	expect(handled, `Message with the type of ${type} was not handled`).toBeTrue();
}

export function expectRelationshipExactSchema(
	relationship: object,
	type: RelationshipType,
	id?: bigint,
	user?: Omit<APIRelationUser, "id"> & { id: bigint },
	nickname?: string,
) {
	expect(relationship).toHaveProperty("type", type);

	const castedRelationship = relationship as APIRelationshipWithoutOwner;
	let handled = false;

	if (id) expect(castedRelationship.id).toBe(id.toString());

	if ([RelationshipType.PENDING_INCOMING, RelationshipType.PENDING_OUTGOING, RelationshipType.FRIEND].includes(type)) {
		expect(Object.keys(relationship).sort()).toStrictEqual(["id", "type", "nickname", "user", "since"].sort());

		if (nickname) expect(castedRelationship.nickname).toBe(nickname);
		if (user) {
			expect(castedRelationship.user).toStrictEqual({
				id: user.id.toString(),
				avatar: user.avatar,
				displayName: user.displayName,
				flags: user.flags,
				username: user.username,
			});
		}

		handled = true;
	}

	expect(handled, `Relationship with the type of ${type} was not handled`).toBeTrue();
}

export function expectPresenceExactSchema(presence: object, user: TestUser, status: PresenceStatus) {
	const castedPresence = presence as UserPresence;
	expect(castedPresence.status).toBe(status);

	if (status === "online") {
		expectUserExactSchema(castedPresence.user, user.id, user.username, user.displayName, user.avatar, user.flags);
	} else if (status === "offline") {
		expect(presence).toStrictEqual({ user: { id: user.id.toString() }, status: "offline" });
	}
}

export function expectTypingExactSchema(typing: object, channelId?: bigint, userId?: bigint) {
	const castedTyping = typing as GatewayTypingStartData;

	expect(Object.keys(typing).sort()).toStrictEqual(["channelId", "userId", "timestamp"].sort());
	if (channelId) expect(castedTyping.channelId).toBe(channelId.toString());
	if (userId) expect(castedTyping.userId).toBe(userId.toString());
}

export function expectRecipientModifyExactSchema(recipientModify: object, channelId?: bigint, user?: TestUser) {
	const castedRecipientModify = recipientModify as GatewayDMCHannelRecipientAddData | GatewayDMCHannelRecipientRemoveData;

	expect(Object.keys(recipientModify).sort()).toStrictEqual(["channelId", "user"].sort());
	if (channelId) expect(castedRecipientModify.channelId).toBe(channelId.toString());
	if (user)
		expect(castedRecipientModify.user).toStrictEqual({
			id: user.id.toString(),
			avatar: user.avatar,
			displayName: user.displayName,
			flags: user.flags,
			username: user.username,
		});
}

export function expectReadStatesExactSchema(readStates: object[], channelId: Snowflake, userIds: bigint[]) {
	const parsedReadStates = readStates as (Omit<APIReadState, "userId"> & { userId: bigint })[];
	expect(readStates.length).toBe(userIds.length);

	expect(
		parsedReadStates.every((x) => userIds.some((y) => y === x.userId)),
		"The user ids of read states does not match the expected user ids",
	).toBeTrue();

	for (const readState of readStates) {
		expect(Object.keys(readState).sort()).toStrictEqual(["channelId", "userId", "lastReadMessageId"].sort());
		expect(readState).toHaveProperty("channelId", BigInt(channelId));
	}
}

export function expectAttachmentExactSchema(
	attachment: object,
	messageId: string,
	channelId: string,
	filename: string,
	width: number,
	height: number,
	description?: string,
) {
	const parsedAttachment = attachment as APIAttachment;

	expect(parsedAttachment).toStrictEqual({
		id: parsedAttachment.id,
		flags: parsedAttachment.flags,
		size: parsedAttachment.size,
		contentType: parsedAttachment.contentType,
		url: parsedAttachment.url,
		filename,
		width,
		height,
		...(parsedAttachment.description || description ? { description } : {}),
	});
	expect(parsedAttachment.url).toInclude(filename);
	expect(parsedAttachment.url).toInclude(messageId);
	expect(parsedAttachment.url).toInclude(channelId);
}

export function expectEmbedExactSchema(
	embed: object,
	type: APIEmbed["type"],
	title?: string,
	url?: string,
	description?: string,
	timestamp?: string,
	thumbnail?: APIThumbnail,
	video?: APIVideo,
) {
	const parsedEmbed = embed as APIEmbed;

	expect(parsedEmbed).toStrictEqual({
		type,
		...(parsedEmbed.title || title ? { title } : {}),
		...(parsedEmbed.url || url ? { url } : {}),
		...(parsedEmbed.description || description ? { description } : {}),
		...(parsedEmbed.type || type ? { type } : {}),
		...(parsedEmbed.timestamp || timestamp ? { timestamp } : {}),
		...(parsedEmbed.thumbnail || thumbnail ? { thumbnail } : {}),
		...(parsedEmbed.video || video ? { video } : {}),
	});
}
