import { Prisma } from "#database";
import { type BigIntToString, type Snowflake } from "@huginn/shared";

export type UserArgs = Prisma.UserDefaultArgs;
export type UserPayload<Args extends UserArgs | undefined> = BigIntToString<Prisma.UserGetPayload<Args>>;

export type AttachmentArgs = Prisma.AttachmentDefaultArgs;
export type AttachmentPayload<Args extends AttachmentArgs | undefined> = BigIntToString<Prisma.AttachmentGetPayload<Args>>;

export type ChannelArgs = Prisma.ChannelDefaultArgs;
export type ChannelPayload<Args extends ChannelArgs | undefined> = BigIntToString<Prisma.ChannelGetPayload<Args>>;

export type MessageArgs = Prisma.MessageDefaultArgs;
export type MessagePayload<Args extends MessageArgs | undefined> = BigIntToString<Prisma.MessageGetPayload<Args>>;

export type EmbedArgs = Prisma.EmbedDefaultArgs;
export type EmbedPayload<Args extends EmbedArgs | undefined> = BigIntToString<Prisma.EmbedGetPayload<Args>>;

export type RelationshipArgs = Prisma.RelationshipDefaultArgs;
export type RelationshipPayload<Args extends RelationshipArgs | undefined> = BigIntToString<Prisma.RelationshipGetPayload<Args>>;

export type ReadStateArgs = Prisma.ReadStateDefaultArgs;
export type ReadStatePayload<Args extends ReadStateArgs | undefined> = BigIntToString<Prisma.ReadStateGetPayload<Args>>;

export type KnownApplicationArgs = Prisma.KnownApplicationDefaultArgs;
export type KnownApplicationPayload<Args extends KnownApplicationArgs | undefined> = Prisma.KnownApplicationGetPayload<Args>;

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

export const selectChannelRecipients = Prisma.validator<Prisma.ChannelSelect>()({
   recipients: { select: { id: true, avatar: true, displayName: true, flags: true, username: true } },
});

export const omitChannelRecipient = (id: Snowflake) =>
   Prisma.validator<Prisma.ChannelSelect>()({ recipients: { where: { id: { not: BigInt(id) } } } });

export const selectChannelDefaults = Prisma.validator<Prisma.ChannelSelect>()({
   ...selectChannelRecipients,
   id: true,
   type: true,
   icon: true,
   name: true,
   ownerId: true,
   lastMessageId: true,
});

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

export const selectMessageCall = Prisma.validator<Prisma.MessageSelect>()({
   call: { select: { participants: { select: { id: true } }, endedTimestamp: true } },
});

export const selectMessageDefaults = Prisma.validator<Prisma.MessageSelect>()({
   ...selectMessageAuthor,
   ...selectMessageMentions,
   ...selectMessageEmbeds,
   ...selectMessageAttachments,
   ...selectMessageCall,
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

// export const selectAllMessage = { ...selectMessageDefaults, ...selectMessageCall };

export const selectRelationshipUser = Prisma.validator<Prisma.RelationshipSelect>()({
   user: { select: selectPublicUser },
});

export const omitMessageAuthorId = Prisma.validator<Prisma.MessageOmit>()({ authorId: true });
export const omitRelationshipUserIds = Prisma.validator<Prisma.RelationshipOmit>()({ userId: true, ownerId: true });

export const selectKnownApplication = Prisma.validator<Prisma.KnownApplicationSelect>()({
   id: true,
   createdAt: true,
   deletedAt: true,
   exeName: true,
   name: true,
   updatedAt: true,
});
