import { type Snowflake, merge } from "@huginn/shared";
import { Prisma } from "@prisma/client";

export const selectPublicUser = Prisma.validator<Prisma.UserSelect>()({
	id: true,
	avatar: true,
	displayName: true,
	flags: true,
	username: true,
});

export const selectPrivateUser = Prisma.validator<Prisma.UserSelect>()({
	id: true,
	avatar: true,
	displayName: true,
	flags: true,
	username: true,
	email: true,
	password: true,
});

export const selectChannelRecipients = Prisma.validator<Prisma.ChannelInclude>()({
	recipients: { select: { id: true, avatar: true, displayName: true, flags: true, username: true } },
});

export const omitChannelRecipient = (id: Snowflake) =>
	Prisma.validator<Prisma.ChannelSelect>()({ recipients: { where: { id: { not: BigInt(id) } } } });

export const selectMessageAuthor = Prisma.validator<Prisma.MessageSelect>()({
	author: { select: selectPublicUser },
});

export const selectMessageMentions = Prisma.validator<Prisma.MessageSelect>()({
	mentions: { select: selectPublicUser },
});

export const selectMessageEmbeds = Prisma.validator<Prisma.MessageSelect>()({
	embeds: {
		select: {
			description: true,
			title: true,
			type: true,
			url: true,
			thumbnail: { select: { height: true, url: true, width: true } },
			video: { select: { url: true, height: true, width: true } },
		},
	},
});

export const selectMessageAttachments = Prisma.validator<Prisma.MessageSelect>()({
	attachments: {
		select: { id: true, contentType: true, description: true, filename: true, flags: true, height: true, size: true, url: true, width: true },
	},
});

export const selectMessageDefaults = Prisma.validator<Prisma.MessageSelect>()({
	...selectMessageAuthor,
	...selectMessageMentions,
	...selectMessageEmbeds,
	...selectMessageAttachments,
	channelId: true,
	content: true,
	timestamp: true,
	editedTimestamp: true,
	type: true,
	pinned: true,
	id: true,
	reactions: true,
	flags: true,
});

export const selectCallMessage = Prisma.validator<Prisma.MessageSelect>()({
	...selectMessageDefaults,
	call: { select: { participants: { select: { id: true } }, endedTimestamp: true } },
});

export const selectRelationshipUser = Prisma.validator<Prisma.RelationshipSelect>()({
	user: { select: selectPublicUser },
});

export const omitMessageAuthorId = Prisma.validator<Prisma.MessageOmit>()({ authorId: true });
export const omitRelationshipUserIds = Prisma.validator<Prisma.RelationshipOmit>()({ userId: true, ownerId: true });
