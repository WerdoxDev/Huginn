import { Prisma } from "@prisma/client/edge";
import { Snowflake } from "@huginn/shared";

export type ChannelInclude = Prisma.ChannelInclude | undefined;
export type ChannelPayload<T extends ChannelInclude> = Prisma.ChannelGetPayload<{
   include: T;
}>;

export type UserInclude = Prisma.UserInclude | undefined;
export type UserSelect = Prisma.UserSelect | undefined;
export type UserPayload<I extends UserInclude = never, S extends UserSelect = never> = Prisma.UserGetPayload<{
   include: I;
   select: S;
}>;

export type MessageInclude = Prisma.MessageInclude | undefined;
export type MessagePayload<T extends MessageInclude> = Prisma.MessageGetPayload<{ include: T }>;

export type RelationshipInclude = Prisma.RelationshipInclude | undefined;
export type RelationshipPayload<T extends RelationshipInclude> = Prisma.RelationshipGetPayload<{ include: T }>;

export const includeChannelRecipients = Prisma.validator<Prisma.ChannelInclude>()({
   recipients: { select: { id: true, username: true, avatar: true, displayName: true } },
});

export const excludeSelfChannelUser = (id: Snowflake) =>
   Prisma.validator<Prisma.ChannelInclude>()({ recipients: { where: { id: { not: BigInt(id) } } } });

export const includeMessageAuthor = Prisma.validator<Prisma.MessageInclude>()({
   author: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});

export const includeMessageMentions = Prisma.validator<Prisma.MessageInclude>()({
   mentions: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});

export const includeRelationshipUser = Prisma.validator<Prisma.RelationshipInclude>()({
   user: { select: { id: true, username: true, displayName: true, avatar: true, flags: true } },
});
