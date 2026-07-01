import { sql } from "drizzle-orm";
import {
   pgTable,
   uniqueIndex,
   foreignKey,
   bigint,
   text,
   boolean,
   timestamp,
   integer,
   index,
   smallint,
   type AnyPgColumn,
   jsonb,
   serial,
   primaryKey,
} from "drizzle-orm/pg-core";

export const identityProvider = pgTable(
   "IdentityProvider",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      providerUserId: text().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }),
      completed: boolean().notNull(),
      providerType: text().notNull(),
      refreshToken: text().notNull(),
   },
   (table) => [
      uniqueIndex("IdentityProvider_providerUserId_key").using("btree", table.providerUserId.asc().nullsLast().op("text_ops")),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "IdentityProvider_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
   ],
);

export const embed = pgTable(
   "Embed",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      title: text(),
      type: text().notNull(),
      description: text(),
      url: text(),
      timestamp: timestamp({ precision: 3, mode: "string" }),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }),
   },
   (table) => [
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "Embed_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const thumbnail = pgTable(
   "Thumbnail",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      width: integer().notNull(),
      height: integer().notNull(),
      url: text().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      embedId: bigint({ mode: "number" }).notNull(),
   },
   (table) => [
      uniqueIndex("Thumbnail_embedId_key").using("btree", table.embedId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.embedId],
         foreignColumns: [embed.id],
         name: "Thumbnail_embedId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const relationship = pgTable(
   "Relationship",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      type: smallint().notNull(),
      nickname: text().notNull(),
      since: timestamp({ precision: 3, mode: "string" }),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      ownerId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).notNull(),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      updatedAt: timestamp({ precision: 3, mode: "string" }),
   },
   (table) => [
      index("Relationship_ownerId_idx").using("btree", table.ownerId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.ownerId],
         foreignColumns: [user.id],
         name: "Relationship_ownerId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "Relationship_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const message = pgTable(
   "Message",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      authorId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      channelId: bigint({ mode: "number" }).notNull(),
      content: text().notNull(),
      timestamp: timestamp({ precision: 3, mode: "string" }).notNull(),
      editedTimestamp: timestamp({ precision: 3, mode: "string" }),
      pinned: boolean().notNull(),
      type: integer().notNull(),
      flags: smallint().notNull(),
   },
   (table) => [
      index("Message_channelId_idx").using("btree", table.channelId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.authorId],
         foreignColumns: [user.id],
         name: "Message_authorId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.channelId],
         foreignColumns: [channel.id],
         name: "Message_channelId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const channel = pgTable(
   "Channel",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      icon: text(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      lastMessageId: bigint({ mode: "number" }),
      name: text(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      ownerId: bigint({ mode: "number" }),
      type: integer().notNull(),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      updatedAt: timestamp({ precision: 3, mode: "string" }),
   },
   (table) => [
      index("Channel_type_idx").using("btree", table.type.asc().nullsLast().op("int4_ops")),
      foreignKey({
         columns: [table.lastMessageId],
         foreignColumns: [message.id],
         name: "Channel_lastMessageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
      foreignKey({
         columns: [table.ownerId],
         foreignColumns: [user.id],
         name: "Channel_ownerId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
   ],
);

export const emailVerification = pgTable(
   "EmailVerification",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      expiresAt: timestamp({ precision: 3, mode: "string" }).notNull(),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).notNull(),
      code: text().notNull(),
      purpose: text().default("email_change").notNull(),
      email: text().notNull(),
   },
   (table) => [
      uniqueIndex("EmailVerification_userId_key").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "EmailVerification_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const user = pgTable(
   "User",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      username: text().notNull(),
      displayName: text(),
      email: text().notNull(),
      avatar: text(),
      password: text(),
      flags: smallint().notNull(),
      system: boolean().default(false).notNull(),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      updatedAt: timestamp({ precision: 3, mode: "string" }),
      bannerColor: text(),
      banner: text(),
      bio: text(),
      accentColor: text(),
      emailVerifiedAt: timestamp({ precision: 3, mode: "string" }),
   },
   (table) => [
      uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
      uniqueIndex("User_username_key").using("btree", table.username.asc().nullsLast().op("text_ops")),
   ],
);

export const messagePin = pgTable(
   "MessagePin",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }).primaryKey().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      channelId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      pinnedById: bigint({ mode: "number" }).notNull(),
      pinnedAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
   },
   (table) => [
      index("MessagePin_channelId_idx").using("btree", table.channelId.asc().nullsLast().op("int8_ops")),
      index("MessagePin_pinnedById_idx").using("btree", table.pinnedById.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.channelId],
         foreignColumns: [channel.id],
         name: "MessagePin_channelId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "MessagePin_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.pinnedById],
         foreignColumns: [user.id],
         name: "MessagePin_pinnedById_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const attachment = pgTable(
   "Attachment",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      filename: text().notNull(),
      description: text(),
      contentType: text().notNull(),
      size: integer().notNull(),
      url: text().notNull(),
      width: integer(),
      height: integer(),
      flags: smallint().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }),
   },
   (table) => [
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "Attachment_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const video = pgTable(
   "Video",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      width: integer().notNull(),
      height: integer().notNull(),
      url: text().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      embedId: bigint({ mode: "number" }).notNull(),
   },
   (table) => [
      uniqueIndex("Video_embedId_key").using("btree", table.embedId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.embedId],
         foreignColumns: [embed.id],
         name: "Video_embedId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const notificationToken = pgTable(
   "NotificationToken",
   {
      token: text().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).notNull(),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      deviceId: text().primaryKey().notNull(),
   },
   (table) => [
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "NotificationToken_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const call = pgTable(
   "Call",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }).notNull(),
      endedTimestamp: timestamp({ precision: 3, mode: "string" }),
   },
   (table) => [
      uniqueIndex("Call_messageId_key").using("btree", table.messageId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "Call_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const settings = pgTable(
   "Settings",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).primaryKey().notNull(),
      json: jsonb().notNull(),
   },
   (table) => [
      uniqueIndex("Settings_userId_key").using("btree", table.userId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "Settings_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const knownApplication = pgTable(
   "KnownApplication",
   {
      id: serial().primaryKey().notNull(),
      names: text().array().notNull(),
      exeName: text().notNull(),
      igdbId: integer(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      contributorId: bigint({ mode: "number" }),
      createdAt: timestamp({ precision: 3, mode: "string" })
         .default(sql`CURRENT_TIMESTAMP`)
         .notNull(),
      updatedAt: timestamp({ precision: 3, mode: "string" }),
      deletedAt: timestamp({ precision: 3, mode: "string" }),
      commandLinePatterns: text().array(),
      active: boolean().default(false).notNull(),
   },
   (table) => [
      index("KnownApplication_names_idx").using("btree", table.names.asc().nullsLast().op("array_ops")),
      foreignKey({
         columns: [table.contributorId],
         foreignColumns: [user.id],
         name: "KnownApplication_contributorId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
   ],
);

export const messageReference = pgTable(
   "MessageReference",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      id: bigint({ mode: "number" }).primaryKey().notNull(),
      type: integer().notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      referrerMessageId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      channelId: bigint({ mode: "number" }).notNull(),
   },
   (table) => [
      index("MessageReference_referrerMessageId_idx").using("btree", table.referrerMessageId.asc().nullsLast().op("int8_ops")),
      uniqueIndex("MessageReference_referrerMessageId_key").using("btree", table.referrerMessageId.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "MessageReference_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
      foreignKey({
         columns: [table.channelId],
         foreignColumns: [channel.id],
         name: "MessageReference_channelId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("restrict"),
      foreignKey({
         columns: [table.referrerMessageId],
         foreignColumns: [message.id],
         name: "MessageReference_referrerMessageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
   ],
);

export const channelRecipients = pgTable(
   "_channel_recipients",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      a: bigint("A", { mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      b: bigint("B", { mode: "number" }).notNull(),
   },
   (table) => [
      index().using("btree", table.b.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.a],
         foreignColumns: [channel.id],
         name: "_channel_recipients_A_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.b],
         foreignColumns: [user.id],
         name: "_channel_recipients_B_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      primaryKey({ columns: [table.a, table.b], name: "_channel_recipients_AB_pkey" }),
   ],
);

export const channelTempDeleted = pgTable(
   "_channel_temp_deleted",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      a: bigint("A", { mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      b: bigint("B", { mode: "number" }).notNull(),
   },
   (table) => [
      index().using("btree", table.b.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.a],
         foreignColumns: [channel.id],
         name: "_channel_temp_deleted_A_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.b],
         foreignColumns: [user.id],
         name: "_channel_temp_deleted_B_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      primaryKey({ columns: [table.a, table.b], name: "_channel_temp_deleted_AB_pkey" }),
   ],
);

export const messageMentions = pgTable(
   "_message_mentions",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      a: bigint("A", { mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      b: bigint("B", { mode: "number" }).notNull(),
   },
   (table) => [
      index().using("btree", table.b.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.a],
         foreignColumns: [message.id],
         name: "_message_mentions_A_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.b],
         foreignColumns: [user.id],
         name: "_message_mentions_B_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      primaryKey({ columns: [table.a, table.b], name: "_message_mentions_AB_pkey" }),
   ],
);

export const participatedCalls = pgTable(
   "_participated_calls",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      a: bigint("A", { mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      b: bigint("B", { mode: "number" }).notNull(),
   },
   (table) => [
      index().using("btree", table.b.asc().nullsLast().op("int8_ops")),
      foreignKey({
         columns: [table.a],
         foreignColumns: [call.id],
         name: "_participated_calls_A_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.b],
         foreignColumns: [user.id],
         name: "_participated_calls_B_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      primaryKey({ columns: [table.a, table.b], name: "_participated_calls_AB_pkey" }),
   ],
);

export const readState = pgTable(
   "ReadState",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      channelId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      lastReadMessageId: bigint({ mode: "number" }),
   },
   (table) => [
      foreignKey({
         columns: [table.channelId],
         foreignColumns: [channel.id],
         name: "ReadState_channelId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "ReadState_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("cascade"),
      foreignKey({
         columns: [table.lastReadMessageId],
         foreignColumns: [message.id],
         name: "ReadState_lastReadMessageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("set null"),
      primaryKey({ columns: [table.channelId, table.userId], name: "ReadState_pkey" }),
   ],
);

export const reactionAggregate = pgTable(
   "ReactionAggregate",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }).notNull(),
      emojiKey: text().notNull(),
      count: integer().notNull(),
   },
   (table) => [
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "ReactionAggregate_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("restrict"),
      primaryKey({ columns: [table.messageId, table.emojiKey], name: "ReactionAggregate_pkey" }),
   ],
);

export const reaction = pgTable(
   "Reaction",
   {
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      channelId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      messageId: bigint({ mode: "number" }).notNull(),
      // You can use { mode: "bigint" } if numbers are exceeding js number limitations
      userId: bigint({ mode: "number" }).notNull(),
      emojiKey: text().notNull(),
   },
   (table) => [
      index("Reaction_messageId_emojiKey_idx").using(
         "btree",
         table.messageId.asc().nullsLast().op("int8_ops"),
         table.emojiKey.asc().nullsLast().op("text_ops"),
      ),
      foreignKey({
         columns: [table.messageId],
         foreignColumns: [message.id],
         name: "Reaction_messageId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("restrict"),
      foreignKey({
         columns: [table.channelId],
         foreignColumns: [channel.id],
         name: "Reaction_channelId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("restrict"),
      foreignKey({
         columns: [table.userId],
         foreignColumns: [user.id],
         name: "Reaction_userId_fkey",
      })
         .onUpdate("cascade")
         .onDelete("restrict"),
      primaryKey({ columns: [table.channelId, table.messageId, table.userId, table.emojiKey], name: "Reaction_pkey" }),
   ],
);
