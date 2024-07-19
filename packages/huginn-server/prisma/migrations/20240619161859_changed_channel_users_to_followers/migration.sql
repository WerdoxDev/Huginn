/*
  Warnings:

  - You are about to drop the `_channel_users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_channel_users" DROP CONSTRAINT "_channel_users_A_fkey";

-- DropForeignKey
ALTER TABLE "_channel_users" DROP CONSTRAINT "_channel_users_B_fkey";

-- DropTable
DROP TABLE "_channel_users";

-- CreateTable
CREATE TABLE "_channel_followers" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_channel_followers_AB_unique" ON "_channel_followers"("A", "B");

-- CreateIndex
CREATE INDEX "_channel_followers_B_index" ON "_channel_followers"("B");

-- AddForeignKey
ALTER TABLE "_channel_followers" ADD CONSTRAINT "_channel_followers_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_channel_followers" ADD CONSTRAINT "_channel_followers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
