import { type Snowflake, merge } from "@huginn/shared";
import { Prisma } from "@prisma/client";

export type ChannelInclude = Prisma.ChannelInclude | undefined;
export type ChannelPayload<I extends ChannelInclude> = Prisma.ChannelGetPayload<{
	include: I;
}>;

export type UserInclude = Prisma.UserInclude | undefined;
export type UserSelect = Prisma.UserSelect | undefined;
export type UserPayload<I extends UserInclude = undefined, S extends UserSelect = undefined> = I extends undefined
	? Prisma.UserGetPayload<{
			select: S;
		}>
	: S extends undefined
		? Prisma.UserGetPayload<{
				include: I;
			}>
		: never;

export type MessageInclude = Prisma.MessageInclude | undefined;
export type MessageOmit = Prisma.MessageOmit | undefined;
export type MessagePayload<I extends MessageInclude = undefined, O extends MessageOmit = undefined> = I extends undefined
	? Prisma.MessageGetPayload<{
			omit: O;
		}>
	: O extends undefined
		? Prisma.MessageGetPayload<{
				include: I;
			}>
		: Prisma.MessageGetPayload<{
				include: I;
				omit: O;
			}>;

export type RelationshipInclude = Prisma.RelationshipInclude | undefined;
export type RelationshipOmit = Prisma.RelationshipOmit | undefined;
export type RelationshipPayload<I extends RelationshipInclude = undefined, O extends RelationshipOmit = undefined> = I extends undefined
	? Prisma.RelationshipGetPayload<{
			omit: O;
		}>
	: O extends undefined
		? Prisma.RelationshipGetPayload<{
				include: I;
			}>
		: Prisma.RelationshipGetPayload<{
				include: I;
				omit: O;
			}>;

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

export const includeChannelRecipients = Prisma.validator<Prisma.ChannelInclude>()({
	recipients: { select: { id: true, avatar: true, displayName: true, flags: true, username: true } },
});

export const excludeChannelRecipient = (id: Snowflake) =>
	Prisma.validator<Prisma.ChannelInclude>()({ recipients: { where: { id: { not: BigInt(id) } } } });

export const includeMessageAuthor = Prisma.validator<Prisma.MessageInclude>()({
	author: { select: selectPublicUser },
});

export const includeMessageMentions = Prisma.validator<Prisma.MessageInclude>()({
	mentions: { select: selectPublicUser },
});

export const includeMessageAuthorAndMentions = merge(includeMessageAuthor, includeMessageMentions);

export const includeRelationshipUser = Prisma.validator<Prisma.RelationshipInclude>()({
	user: { select: selectPublicUser },
});

export const omitMessageAuthorId = Prisma.validator<Prisma.MessageOmit>()({ authorId: true });
export const omitRelationshipUserIds = Prisma.validator<Prisma.RelationshipOmit>()({ userId: true, ownerId: true });
