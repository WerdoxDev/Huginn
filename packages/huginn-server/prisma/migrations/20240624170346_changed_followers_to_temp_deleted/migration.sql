/*
  Warnings:

  - You are about to drop the `_channel_followers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_channel_followers" DROP CONSTRAINT "_channel_followers_A_fkey";

-- DropForeignKey
ALTER TABLE "_channel_followers" DROP CONSTRAINT "_channel_followers_B_fkey";

-- DropTable
DROP TABLE "_channel_followers";

-- CreateTable
CREATE TABLE "_channel_temp_deleted" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_channel_temp_deleted_AB_unique" ON "_channel_temp_deleted"("A", "B");

-- CreateIndex
CREATE INDEX "_channel_temp_deleted_B_index" ON "_channel_temp_deleted"("B");

-- AddForeignKey
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_channel_temp_deleted" ADD CONSTRAINT "_channel_temp_deleted_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
