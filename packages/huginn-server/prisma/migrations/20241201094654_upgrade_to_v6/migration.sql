-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_channel_recipients_AB_unique";

-- AlterTable
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_channel_temp_deleted_AB_unique";

-- AlterTable
ALTER TABLE "_message_mentions" ADD CONSTRAINT "_message_mentions_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_message_mentions_AB_unique";

-- CreateTable
CREATE TABLE "IdentityProvider" (
    "id" BIGINT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "userId" BIGINT,
    "completed" BOOLEAN NOT NULL,
    "providerType" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,

    CONSTRAINT "IdentityProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadState" (
    "channelId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "lastReadMessageId" BIGINT,

    CONSTRAINT "ReadState_pkey" PRIMARY KEY ("channelId","userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProvider_providerUserId_key" ON "IdentityProvider"("providerUserId");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityProvider" ADD CONSTRAINT "IdentityProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadState" ADD CONSTRAINT "ReadState_lastReadMessageId_fkey" FOREIGN KEY ("lastReadMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
