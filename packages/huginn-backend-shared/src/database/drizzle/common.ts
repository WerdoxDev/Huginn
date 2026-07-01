import type { PayloadForArgs, SelectInput } from "better-drizzle";

import { idFix, type BigIntToString, type Snowflake } from "@huginn/shared";

import { schema } from "./db";

export type UserSelect = SelectInput<typeof schema, "user">;
export type UserArgs = { select: UserSelect };
export type UserPayload<Args extends UserArgs> = BigIntToString<PayloadForArgs<typeof schema, "user", Args>>;

export type MessageSelect = SelectInput<typeof schema, "message">;
export type MessageArgs = { select: MessageSelect };
export type MessagePayload<Args extends MessageArgs> = BigIntToString<PayloadForArgs<typeof schema, "message", Args>>;

export type ChannelSelect = SelectInput<typeof schema, "channel">;
export type ChannelArgs = { select: ChannelSelect };
export type ChannelPayload<Args extends ChannelArgs> = BigIntToString<PayloadForArgs<typeof schema, "channel", Args>>;

export type MessagePinSelect = SelectInput<typeof schema, "messagePin">;
export type MessagePinArgs = { select: MessagePinSelect };
export type MessagePinPayload<Args extends MessagePinArgs> = BigIntToString<PayloadForArgs<typeof schema, "messagePin", Args>>;

export const selectPublicUser = {
   id: true,
   avatar: true,
   banner: true,
   bannerColor: true,
   accentColor: true,
   bio: true,
   displayName: true,
   flags: true,
   username: true,
} satisfies UserSelect;

export const selectPrivateUser = {
   id: true,
   avatar: true,
   banner: true,
   bannerColor: true,
   accentColor: true,
   bio: true,
   displayName: true,
   flags: true,
   username: true,
   email: true,
} satisfies UserSelect;

export const selectMessageAuthor = {
   author: { select: selectPublicUser },
} satisfies MessageSelect;

export const selectMessageMentions = {
   mentions: { select: { user: { select: selectPublicUser } } },
} satisfies MessageSelect;

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
} satisfies MessageSelect;

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
} satisfies MessageSelect;

export const selectMessageCall = {
   call: { select: { participants: { select: { user: { select: { id: true } } } }, endedTimestamp: true } },
} satisfies MessageSelect;

export const selectMessageDefaults = {
   channelId: true,
   content: true,
   timestamp: true,
   editedTimestamp: true,
   type: true,
   pinned: true,
   id: true,
   flags: true,
} satisfies MessageSelect;

export const selectMessageReactions = {
   reactionAggregates: { select: { messageId: true, emojiKey: true, count: true } },
} satisfies MessageSelect;

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
               ...selectMessageReactions,
               messageReference: { select: { channelId: true, messageId: true, type: true } },
            },
         },
      },
   },
} satisfies MessageSelect;

export const selectAllMessage = {
   ...selectMessageAuthor,
   ...selectMessageMentions,
   ...selectMessageEmbeds,
   ...selectMessageAttachments,
   ...selectMessageCall,
   ...selectMessageReference,
   ...selectMessageDefaults,
   ...selectMessageReactions,
} satisfies MessageSelect;

export const selectChannelRecipients = {
   recipients: {
      select: {
         user: {
            select: { id: true, avatar: true, displayName: true, flags: true, username: true, banner: true, bannerColor: true, accentColor: true, bio: true },
         },
      },
   },
} satisfies ChannelSelect;

export const omitChannelRecipient = (id: Snowflake) => ({ recipients: { where: { user: { is: { id: { not: BigInt(id) } } } } } }) satisfies ChannelSelect;

export const selectChannelDefaults = {
   ...selectChannelRecipients,
   id: true,
   type: true,
   icon: true,
   name: true,
   ownerId: true,
   lastMessageId: true,
} satisfies ChannelSelect;

export const selectMessagePin = {
   pinnedAt: true,
   message: { select: selectAllMessage },
} satisfies MessagePinSelect;
