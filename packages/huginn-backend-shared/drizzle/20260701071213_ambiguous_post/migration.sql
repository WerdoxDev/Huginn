-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "_channel_recipients" (
	"A" bigint,
	"B" bigint,
	CONSTRAINT "_channel_recipients_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_channel_temp_deleted" (
	"A" bigint,
	"B" bigint,
	CONSTRAINT "_channel_temp_deleted_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_message_mentions" (
	"A" bigint,
	"B" bigint,
	CONSTRAINT "_message_mentions_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "_participated_calls" (
	"A" bigint,
	"B" bigint,
	CONSTRAINT "_participated_calls_AB_pkey" PRIMARY KEY("A","B")
);
--> statement-breakpoint
CREATE TABLE "Attachment" (
	"id" bigint PRIMARY KEY,
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
CREATE TABLE "Call" (
	"id" bigint PRIMARY KEY,
	"messageId" bigint NOT NULL,
	"endedTimestamp" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "Channel" (
	"id" bigint PRIMARY KEY,
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
	"id" bigint PRIMARY KEY,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"userId" bigint NOT NULL,
	"code" text NOT NULL,
	"purpose" text DEFAULT 'email_change' NOT NULL,
	"email" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Embed" (
	"id" bigint PRIMARY KEY,
	"title" text,
	"type" text NOT NULL,
	"description" text,
	"url" text,
	"timestamp" timestamp(3),
	"messageId" bigint
);
--> statement-breakpoint
CREATE TABLE "IdentityProvider" (
	"id" bigint PRIMARY KEY,
	"providerUserId" text NOT NULL,
	"userId" bigint,
	"completed" boolean NOT NULL,
	"providerType" text NOT NULL,
	"refreshToken" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "KnownApplication" (
	"id" serial PRIMARY KEY,
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
CREATE TABLE "Message" (
	"id" bigint PRIMARY KEY,
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
CREATE TABLE "MessagePin" (
	"messageId" bigint PRIMARY KEY,
	"channelId" bigint NOT NULL,
	"pinnedById" bigint NOT NULL,
	"pinnedAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "MessageReference" (
	"id" bigint PRIMARY KEY,
	"type" integer NOT NULL,
	"referrerMessageId" bigint NOT NULL,
	"messageId" bigint,
	"channelId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "NotificationToken" (
	"token" text NOT NULL,
	"userId" bigint NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"deviceId" text PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE "Reaction" (
	"channelId" bigint,
	"messageId" bigint,
	"userId" bigint,
	"emojiKey" text,
	CONSTRAINT "Reaction_pkey" PRIMARY KEY("channelId","messageId","userId","emojiKey")
);
--> statement-breakpoint
CREATE TABLE "ReactionAggregate" (
	"messageId" bigint,
	"emojiKey" text,
	"count" integer NOT NULL,
	CONSTRAINT "ReactionAggregate_pkey" PRIMARY KEY("messageId","emojiKey")
);
--> statement-breakpoint
CREATE TABLE "ReadState" (
	"channelId" bigint,
	"userId" bigint,
	"lastReadMessageId" bigint,
	CONSTRAINT "ReadState_pkey" PRIMARY KEY("channelId","userId")
);
--> statement-breakpoint
CREATE TABLE "Relationship" (
	"id" bigint PRIMARY KEY,
	"type" smallint NOT NULL,
	"nickname" text NOT NULL,
	"since" timestamp(3),
	"ownerId" bigint NOT NULL,
	"userId" bigint NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "Settings" (
	"userId" bigint PRIMARY KEY,
	"json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Thumbnail" (
	"id" bigint PRIMARY KEY,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"url" text NOT NULL,
	"embedId" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" bigint PRIMARY KEY,
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
CREATE TABLE "Video" (
	"id" bigint PRIMARY KEY,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"url" text NOT NULL,
	"embedId" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "_channel_recipients_B_index" ON "_channel_recipients" ("B");--> statement-breakpoint
CREATE INDEX "_channel_temp_deleted_B_index" ON "_channel_temp_deleted" ("B");--> statement-breakpoint
CREATE INDEX "_message_mentions_B_index" ON "_message_mentions" ("B");--> statement-breakpoint
CREATE INDEX "_participated_calls_B_index" ON "_participated_calls" ("B");--> statement-breakpoint
CREATE UNIQUE INDEX "Call_messageId_key" ON "Call" ("messageId");--> statement-breakpoint
CREATE INDEX "Channel_type_idx" ON "Channel" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "EmailVerification_userId_key" ON "EmailVerification" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "IdentityProvider_providerUserId_key" ON "IdentityProvider" ("providerUserId");--> statement-breakpoint
CREATE INDEX "KnownApplication_names_idx" ON "KnownApplication" ("names");--> statement-breakpoint
CREATE INDEX "Message_channelId_idx" ON "Message" ("channelId");--> statement-breakpoint
CREATE INDEX "MessagePin_channelId_idx" ON "MessagePin" ("channelId");--> statement-breakpoint
CREATE INDEX "MessagePin_pinnedById_idx" ON "MessagePin" ("pinnedById");--> statement-breakpoint
CREATE INDEX "MessageReference_referrerMessageId_idx" ON "MessageReference" ("referrerMessageId");--> statement-breakpoint
CREATE UNIQUE INDEX "MessageReference_referrerMessageId_key" ON "MessageReference" ("referrerMessageId");--> statement-breakpoint
CREATE INDEX "Reaction_messageId_emojiKey_idx" ON "Reaction" ("messageId","emojiKey");--> statement-breakpoint
CREATE INDEX "Relationship_ownerId_idx" ON "Relationship" ("ownerId");--> statement-breakpoint
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Thumbnail_embedId_key" ON "Thumbnail" ("embedId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "Video_embedId_key" ON "Video" ("embedId");--> statement-breakpoint
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Message" ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "IdentityProvider" ADD CONSTRAINT "IdentityProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Embed" ADD CONSTRAINT "Embed_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Thumbnail" ADD CONSTRAINT "Thumbnail_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "Embed"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Video" ADD CONSTRAINT "Video_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "Embed"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Call" ADD CONSTRAINT "Call_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_participated_calls" ADD CONSTRAINT "_participated_calls_A_fkey" FOREIGN KEY ("A") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "_participated_calls" ADD CONSTRAINT "_participated_calls_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "KnownApplication" ADD CONSTRAINT "KnownApplication_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessageReference" ADD CONSTRAINT "MessageReference_referrerMessageId_fkey" FOREIGN KEY ("referrerMessageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "MessagePin" ADD CONSTRAINT "MessagePin_pinnedById_fkey" FOREIGN KEY ("pinnedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "NotificationToken" ADD CONSTRAINT "NotificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;--> statement-breakpoint
ALTER TABLE "ReactionAggregate" ADD CONSTRAINT "ReactionAggregate_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
*/