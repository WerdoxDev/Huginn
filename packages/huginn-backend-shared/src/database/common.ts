import type { Prisma } from "#database";
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
export type KnownApplicationPayload<Args extends KnownApplicationArgs | undefined> = BigIntToString<Prisma.KnownApplicationGetPayload<Args>>;

export const selectPublicUser = {
   id: true,
   avatar: true,
   displayName: true,
   flags: true,
   username: true,
} satisfies Prisma.UserSelect;

export const selectPrivateUser = {
   id: true,
   avatar: true,
   displayName: true,
   flags: true,
   username: true,
   email: true,
   password: true,
} satisfies Prisma.UserSelect;

export const selectChannelRecipients = {
   recipients: { select: { id: true, avatar: true, displayName: true, flags: true, username: true } },
} satisfies Prisma.ChannelSelect;

export const omitChannelRecipient = (id: Snowflake) => ({ recipients: { where: { id: { not: BigInt(id) } } } }) satisfies Prisma.ChannelSelect;

export const selectChannelDefaults = {
   ...selectChannelRecipients,
   id: true,
   type: true,
   icon: true,
   name: true,
   ownerId: true,
   lastMessageId: true,
} satisfies Prisma.ChannelSelect;

export const selectMessageAuthor = {
   author: { select: selectPublicUser },
} satisfies Prisma.MessageSelect;

export const selectMessageMentions = {
   mentions: { select: selectPublicUser },
} satisfies Prisma.MessageSelect;

export const selectMessageEmbeds = {
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
} satisfies Prisma.MessageSelect;

export const selectMessageAttachments = {
   attachments: {
      select: {
         id: true,
         contentType: true,
         description: true,
         filename: true,
         flags: true,
         height: true,
         size: true,
         url: true,
         width: true,
      },
   },
} satisfies Prisma.MessageSelect;

export const selectMessageCall = {
   call: { select: { participants: { select: { id: true } }, endedTimestamp: true } },
} satisfies Prisma.MessageSelect;

export const selectMessageDefaults = {
   channelId: true,
   content: true,
   timestamp: true,
   editedTimestamp: true,
   type: true,
   pinned: true,
   id: true,
   reactions: true,
   flags: true,
   deletedTimestamp: false,
} satisfies Prisma.MessageSelect;

export const selectMessageReference = {
   messageReference: {
      select: {
         channelId: true,
         messageId: true,
         type: true,
         message: {
            select: {
               ...selectMessageAuthor,
               ...selectMessageMentions,
               ...selectMessageEmbeds,
               ...selectMessageAttachments,
               ...selectMessageCall,
               ...selectMessageDefaults,
               messageReference: { select: { channelId: true, messageId: true, type: true } },
            },
         },
      },
   },
} satisfies Prisma.MessageSelect;

export const selectAllMessage = {
   ...selectMessageAuthor,
   ...selectMessageMentions,
   ...selectMessageEmbeds,
   ...selectMessageAttachments,
   ...selectMessageCall,
   ...selectMessageReference,
   ...selectMessageDefaults,
} satisfies Prisma.MessageSelect;

// export const selectAllMessage = { ...selectMessageDefaults, ...selectMessageCall };

export const selectRelationshipUser = {
   user: { select: selectPublicUser },
} satisfies Prisma.RelationshipSelect;

export const omitMessageAuthorId = { authorId: true } satisfies Prisma.MessageOmit;
export const omitRelationshipUserIds = { userId: true, ownerId: true } satisfies Prisma.RelationshipOmit;

export const selectKnownApplication = {
   id: true,
   createdAt: true,
   deletedAt: true,
   exeName: true,
   names: true,
   updatedAt: true,
   contributorId: true,
   igdbId: true,
   commandLinePatterns: true,
} satisfies Prisma.KnownApplicationSelect;
