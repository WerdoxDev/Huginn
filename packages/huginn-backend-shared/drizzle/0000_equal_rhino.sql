-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "IdentityProvider" (
	"id" bigint PRIMARY KEY NOT NULL,
	"providerUserId" text NOT NULL,
	"userId" bigint,
	"completed" boolean NOT NULL,
	"providerType" text NOT NULL,
	"refreshToken" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Embed" (
	"id" bigint PRIMARY KEY NOT NULL,
	"title" text,
	"type" text NOT NULL,
	"description" text,
	"url" text,
	"timestamp" timestamp(3),
	"messageId" bigint
);
--> statement-breakpoint
CREATE TABLE "Thumbnail" (
	"id" bigint PRIMARY KEY NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"url" text NOT NULL,
	"embedId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Relationship" (
	"id" bigint PRIMARY KEY NOT NULL,
	"type" smallint NOT NULL,
	"nickname" text NOT NULL,
	"since" timestamp(3),
	"ownerId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "Message" (
	"id" bigint PRIMARY KEY NOT NULL,
	"authorId" bigint NOT NULL,
	"channelId" bigint NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp(3) NOT NULL,
	"editedTimestamp" timestamp(3),
	"pinned" boolean NOT NULL,
	"type" integer NOT NULL,
	"flags" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Channel" (
	"id" bigint PRIMARY KEY NOT NULL,
	"icon" text,
	"lastMessageId" bigint,
	"name" text,
	"ownerId" bigint,
	"type" integer NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "EmailVerification" (
	"id" bigint PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"userId" bigint NOT NULL,
	"code" text NOT NULL,
	"purpose" text DEFAULT 'email_change' NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" bigint PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"displayName" text,
	"email" text NOT NULL,
	"avatar" text,
	"password" text,
	"flags" smallint NOT NULL,
	"system" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"bannerColor" text,
	"banner" text,
	"bio" text,
	"accentColor" text,
	"emailVerifiedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "MessagePin" (
	"messageId" bigint PRIMARY KEY NOT NULL,
	"channelId" bigint NOT NULL,
	"pinnedById" bigint NOT NULL,
	"pinnedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Attachment" (
	"id" bigint PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"description" text,
	"contentType" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"width" integer,
	"height" integer,
	"flags" smallint NOT NULL,
	"messageId" bigint
);
--> statement-breakpoint
CREATE TABLE "Video" (
	"id" bigint PRIMARY KEY NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"url" text NOT NULL,
	"embedId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NotificationToken" (
	"token" text NOT NULL,
	"userId" bigint NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deviceId" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Call" (
	"id" bigint PRIMARY KEY NOT NULL,
	"messageId" bigint NOT NULL,
	"endedTimestamp" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"userId" bigint PRIMARY KEY NOT NULL,
	"json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KnownApplication" (
	"id" serial PRIMARY KEY NOT NULL,
	"names" text[] NOT NULL,
	"exeName" text NOT NULL,
	"igdbId" integer,
	"contributorId" bigint,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3),
	"deletedAt" timestamp(3),
	"commandLinePatterns" text[],
	"active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MessageReference" (
	"id" bigint PRIMARY KEY NOT NULL,
	"type" integer NOT NULL,
	"referrerMessageId" bigint NOT NULL,
	"messageId" bigint,
	"channelId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "_channel_recipients" (
	"A" bigint NOT NULL,
	"B" bigint NOT NULL,
	CONSTRAINT "_channel_recipients_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_channel_temp_deleted" (
	"A" bigint NOT NULL,
	"B" bigint NOT NULL,
	CONSTRAINT "_channel_temp_deleted_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_message_mentions" (
	"A" bigint NOT NULL,
	"B" bigint NOT NULL,
	CONSTRAINT "_message_mentions_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_participated_calls" (
	"A" bigint NOT NULL,
	"B" bigint NOT NULL,
	CONSTRAINT "_participated_calls_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "ReadState" (
	"channelId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"lastReadMessageId" bigint,
	CONSTRAINT "ReadState_pkey" PRIMARY KEY("channelId","userId")
);
--> statement-breakpoint
CREATE TABLE "ReactionAggregate" (
	"messageId" bigint NOT NULL,
	"emojiKey" text NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "ReactionAggregate_pkey" PRIMARY KEY("messageId","emojiKey")
);
--> statement-breakpoint
CREATE TABLE "Reaction" (
	"channelId" bigint NOT NULL,
	"messageId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"emojiKey" text NOT NULL,
	CONSTRAINT "Reaction_pkey" PRIMARY KEY("channelId","messageId","userId","emojiKey")
);
--> statement-breakpoint
ALTER TABLE "IdentityProvider" ADD CONSTRAINT "IdentityProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Embed" ADD CONSTRAINT "Embed_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Thumbnail" ADD CONSTRAINT "Thumbnail_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "public"."Embed"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "public"."Message"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Video" ADD CONSTRAINT "Video_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "public"."Embed"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Call" ADD CONSTRAINT "Call_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "KnownApplication" ADD CONSTRAINT "KnownApplication_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_referrerMessageId_fkey" FOREIGN KEY ("referrerMessageId") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Channel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Channel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Message"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_participated_calls" ADD CONSTRAINT "_participated_calls_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Call"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "_participated_calls" ADD CONSTRAINT "_participated_calls_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "public"."Message"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "ReactionAggregate" ADD CONSTRAINT "ReactionAggregate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "public"."Channel"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "IdentityProvider_providerUserId_key" ON "IdentityProvider" USING btree ("providerUserId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Thumbnail_embedId_key" ON "Thumbnail" USING btree ("embedId" int8_ops);--> statement-breakpoint
CREATE INDEX "Relationship_ownerId_idx" ON "Relationship" USING btree ("ownerId" int8_ops);--> statement-breakpoint
CREATE INDEX "Message_channelId_idx" ON "Message" USING btree ("channelId" int8_ops);--> statement-breakpoint
CREATE INDEX "Channel_type_idx" ON "Channel" USING btree ("type" int4_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification" USING btree ("userId" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "User" USING btree ("username" text_ops);--> statement-breakpoint
CREATE INDEX "MessagePin_channelId_idx" ON "MessagePin" USING btree ("channelId" int8_ops);--> statement-breakpoint
CREATE INDEX "MessagePin_pinnedById_idx" ON "MessagePin" USING btree ("pinnedById" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Video_embedId_key" ON "Video" USING btree ("embedId" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Call_messageId_key" ON "Call" USING btree ("messageId" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings" USING btree ("userId" int8_ops);--> statement-breakpoint
CREATE INDEX "KnownApplication_names_idx" ON "KnownApplication" USING btree ("names" array_ops);--> statement-breakpoint
CREATE INDEX "MessageReference_referrerMessageId_idx" ON "MessageReference" USING btree ("referrerMessageId" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "MessageReference_referrerMessageId_key" ON "MessageReference" USING btree ("referrerMessageId" int8_ops);--> statement-breakpoint
CREATE INDEX "_channel_recipients_B_index" ON "_channel_recipients" USING btree ("B" int8_ops);--> statement-breakpoint
CREATE INDEX "_channel_temp_deleted_B_index" ON "_channel_temp_deleted" USING btree ("B" int8_ops);--> statement-breakpoint
CREATE INDEX "_message_mentions_B_index" ON "_message_mentions" USING btree ("B" int8_ops);--> statement-breakpoint
CREATE INDEX "_participated_calls_B_index" ON "_participated_calls" USING btree ("B" int8_ops);--> statement-breakpoint
CREATE INDEX "Reaction_messageId_emojiKey_idx" ON "Reaction" USING btree ("messageId" int8_ops,"emojiKey" text_ops);
*/