/*
  Warnings:

  - You are about to drop the `ChannelsOnUsers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserMentionsOnMessages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChannelsOnUsers" DROP CONSTRAINT "ChannelsOnUsers_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelsOnUsers" DROP CONSTRAINT "ChannelsOnUsers_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserMentionsOnMessages" DROP CONSTRAINT "UserMentionsOnMessages_messageId_fkey";

-- DropForeignKey
ALTER TABLE "UserMentionsOnMessages" DROP CONSTRAINT "UserMentionsOnMessages_userId_fkey";

-- DropTable
DROP TABLE "ChannelsOnUsers";

-- DropTable
DROP TABLE "UserMentionsOnMessages";

-- CreateTable
CREATE TABLE "_channel_users" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "_message_mentions" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_channel_users_AB_unique" ON "_channel_users"("A", "B");

-- CreateIndex
CREATE INDEX "_channel_users_B_index" ON "_channel_users"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_message_mentions_AB_unique" ON "_message_mentions"("A", "B");

-- CreateIndex
CREATE INDEX "_message_mentions_B_index" ON "_message_mentions"("B");

-- AddForeignKey
ALTER TABLE "_channel_users" ADD CONSTRAINT "_channel_users_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_channel_users" ADD CONSTRAINT "_channel_users_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_A_fkey" FOREIGN KEY ("A") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
