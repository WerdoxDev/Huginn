import { relations } from "drizzle-orm/relations";

import {
   user,
   identityProvider,
   message,
   embed,
   thumbnail,
   relationship,
   channel,
   emailVerification,
   messagePin,
   attachment,
   video,
   notificationToken,
   call,
   settings,
   knownApplication,
   messageReference,
   channelRecipients,
   channelTempDeleted,
   messageMentions,
   participatedCalls,
   readState,
   reactionAggregate,
   reaction,
} from "./schema";

export const identityProviderRelations = relations(identityProvider, ({ one }) => ({
   user: one(user, {
      fields: [identityProvider.userId],
      references: [user.id],
   }),
}));

export const userRelations = relations(user, ({ many }) => ({
   identityProviders: many(identityProvider),
   relationships_ownerId: many(relationship, {
      relationName: "relationship_ownerId_user_id",
   }),
   relationships_userId: many(relationship, {
      relationName: "relationship_userId_user_id",
   }),
   messages: many(message),
   channels: many(channel),
   emailVerifications: many(emailVerification),
   messagePins: many(messagePin),
   notificationTokens: many(notificationToken),
   settings: many(settings),
   knownApplications: many(knownApplication),
   channelRecipients: many(channelRecipients),
   channelTempDeleteds: many(channelTempDeleted),
   messageMentions: many(messageMentions),
   participatedCalls: many(participatedCalls),
   readStates: many(readState),
   reactions: many(reaction),
}));

export const embedRelations = relations(embed, ({ one, many }) => ({
   message: one(message, {
      fields: [embed.messageId],
      references: [message.id],
   }),
   thumbnails: many(thumbnail),
   videos: many(video),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
   embeds: many(embed),
   user: one(user, {
      fields: [message.authorId],
      references: [user.id],
   }),
   channel: one(channel, {
      fields: [message.channelId],
      references: [channel.id],
      relationName: "message_channelId_channel_id",
   }),
   channels: many(channel, {
      relationName: "channel_lastMessageId_message_id",
   }),
   messagePins: many(messagePin),
   attachments: many(attachment),
   calls: many(call),
   messageReferences_messageId: many(messageReference, {
      relationName: "messageReference_messageId_message_id",
   }),
   messageReferences_referrerMessageId: many(messageReference, {
      relationName: "messageReference_referrerMessageId_message_id",
   }),
   messageMentions: many(messageMentions),
   readStates: many(readState),
   reactionAggregates: many(reactionAggregate),
   reactions: many(reaction),
}));

export const thumbnailRelations = relations(thumbnail, ({ one }) => ({
   embed: one(embed, {
      fields: [thumbnail.embedId],
      references: [embed.id],
   }),
}));

export const relationshipRelations = relations(relationship, ({ one }) => ({
   user_ownerId: one(user, {
      fields: [relationship.ownerId],
      references: [user.id],
      relationName: "relationship_ownerId_user_id",
   }),
   user_userId: one(user, {
      fields: [relationship.userId],
      references: [user.id],
      relationName: "relationship_userId_user_id",
   }),
}));

export const channelRelations = relations(channel, ({ one, many }) => ({
   messages: many(message, {
      relationName: "message_channelId_channel_id",
   }),
   message: one(message, {
      fields: [channel.lastMessageId],
      references: [message.id],
      relationName: "channel_lastMessageId_message_id",
   }),
   user: one(user, {
      fields: [channel.ownerId],
      references: [user.id],
   }),
   messagePins: many(messagePin),
   messageReferences: many(messageReference),
   channelRecipients: many(channelRecipients),
   channelTempDeleteds: many(channelTempDeleted),
   readStates: many(readState),
   reactions: many(reaction),
}));

export const emailVerificationRelations = relations(emailVerification, ({ one }) => ({
   user: one(user, {
      fields: [emailVerification.userId],
      references: [user.id],
   }),
}));

export const messagePinRelations = relations(messagePin, ({ one }) => ({
   channel: one(channel, {
      fields: [messagePin.channelId],
      references: [channel.id],
   }),
   message: one(message, {
      fields: [messagePin.messageId],
      references: [message.id],
   }),
   user: one(user, {
      fields: [messagePin.pinnedById],
      references: [user.id],
   }),
}));

export const attachmentRelations = relations(attachment, ({ one }) => ({
   message: one(message, {
      fields: [attachment.messageId],
      references: [message.id],
   }),
}));

export const videoRelations = relations(video, ({ one }) => ({
   embed: one(embed, {
      fields: [video.embedId],
      references: [embed.id],
   }),
}));

export const notificationTokenRelations = relations(notificationToken, ({ one }) => ({
   user: one(user, {
      fields: [notificationToken.userId],
      references: [user.id],
   }),
}));

export const callRelations = relations(call, ({ one, many }) => ({
   message: one(message, {
      fields: [call.messageId],
      references: [message.id],
   }),
   participatedCalls: many(participatedCalls),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
   user: one(user, {
      fields: [settings.userId],
      references: [user.id],
   }),
}));

export const knownApplicationRelations = relations(knownApplication, ({ one }) => ({
   user: one(user, {
      fields: [knownApplication.contributorId],
      references: [user.id],
   }),
}));

export const messageReferenceRelations = relations(messageReference, ({ one }) => ({
   message_messageId: one(message, {
      fields: [messageReference.messageId],
      references: [message.id],
      relationName: "messageReference_messageId_message_id",
   }),
   channel: one(channel, {
      fields: [messageReference.channelId],
      references: [channel.id],
   }),
   message_referrerMessageId: one(message, {
      fields: [messageReference.referrerMessageId],
      references: [message.id],
      relationName: "messageReference_referrerMessageId_message_id",
   }),
}));

export const channelRecipientsRelations = relations(channelRecipients, ({ one }) => ({
   channel: one(channel, {
      fields: [channelRecipients.a],
      references: [channel.id],
   }),
   user: one(user, {
      fields: [channelRecipients.b],
      references: [user.id],
   }),
}));

export const channelTempDeletedRelations = relations(channelTempDeleted, ({ one }) => ({
   channel: one(channel, {
      fields: [channelTempDeleted.a],
      references: [channel.id],
   }),
   user: one(user, {
      fields: [channelTempDeleted.b],
      references: [user.id],
   }),
}));

export const messageMentionsRelations = relations(messageMentions, ({ one }) => ({
   message: one(message, {
      fields: [messageMentions.a],
      references: [message.id],
   }),
   user: one(user, {
      fields: [messageMentions.b],
      references: [user.id],
   }),
}));

export const participatedCallsRelations = relations(participatedCalls, ({ one }) => ({
   call: one(call, {
      fields: [participatedCalls.a],
      references: [call.id],
   }),
   user: one(user, {
      fields: [participatedCalls.b],
      references: [user.id],
   }),
}));

export const readStateRelations = relations(readState, ({ one }) => ({
   channel: one(channel, {
      fields: [readState.channelId],
      references: [channel.id],
   }),
   user: one(user, {
      fields: [readState.userId],
      references: [user.id],
   }),
   message: one(message, {
      fields: [readState.lastReadMessageId],
      references: [message.id],
   }),
}));

export const reactionAggregateRelations = relations(reactionAggregate, ({ one }) => ({
   message: one(message, {
      fields: [reactionAggregate.messageId],
      references: [message.id],
   }),
}));

export const reactionRelations = relations(reaction, ({ one }) => ({
   message: one(message, {
      fields: [reaction.messageId],
      references: [message.id],
   }),
   channel: one(channel, {
      fields: [reaction.channelId],
      references: [channel.id],
   }),
   user: one(user, {
      fields: [reaction.userId],
      references: [user.id],
   }),
}));
