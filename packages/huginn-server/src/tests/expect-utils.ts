import { expect } from "bun:test";
import {
	type APIChannelUser,
	type APIDefaultMessage,
	type APIMessage,
	type APIMessageUser,
	type APIPostDMChannelResult,
	type APIPublicUser,
	type APIRelationUser,
	type APIRelationshipWithoutOwner,
	type APIUser,
	ChannelType,
	type DirectChannel,
	MessageType,
	RelationshipType,
	type Snowflake,
} from "@huginn/shared";

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

export function expectChannelExactSchema(channel: object, type: ChannelType, id?: bigint, ownerIds?: bigint[], name?: string, icon?: string) {
	expect(channel).toHaveProperty("type", type);

	const castedChannel = channel as DirectChannel;
	let handled = false;

	if (id) expect(castedChannel.id).toBe(id.toString());

	if (type === ChannelType.DM) {
		expect(Object.keys(channel).sort()).toStrictEqual(["id", "lastMessageId", "recipients", "type"].sort());
		handled = true;
	}

	if (type === ChannelType.GROUP_DM) {
		expect(Object.keys(channel).sort()).toStrictEqual(["id", "lastMessageId", "recipients", "type", "icon", "name", "ownerId"].sort());
		if (ownerIds && castedChannel.ownerId) expect(ownerIds).toContain(BigInt(castedChannel.ownerId));
		expect(castedChannel.name).toBe(name ? name : null);
		expect(castedChannel.icon).toBe(icon ? icon : null);
		handled = true;
	}

	for (const recipient of (channel as APIPostDMChannelResult).recipients) {
		expect(Object.keys(recipient).sort()).toStrictEqual(["id", "username", "displayName", "flags", "avatar"].sort());
	}

	if (!handled) {
		throw new Error(`Channel with the type of ${type} was not handled`);
	}
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
			["id", "type", "channelId", "author", "content", "createdAt", "editedAt", "attachments", "pinned", "mentions", "reactions", "flags"].sort(),
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
		expect(Object.keys(castedMessage.author).sort()).toStrictEqual(["id", "username", "displayName", "flags", "avatar"].sort());

		handled = true;
	}

	if (!handled) {
		throw new Error(`Message with the type of ${type} was not handled`);
	}
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

	if (!handled) {
		throw new Error(`Relationship with the type of ${type} was not handled`);
	}
}

function containsId(recipients: APIChannelUser[], id: Snowflake | undefined) {
	return recipients.some((x) => x.id === id);
}
