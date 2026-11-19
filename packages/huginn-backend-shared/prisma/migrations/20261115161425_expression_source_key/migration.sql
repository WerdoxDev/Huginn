/*
  Warnings:

  - You are about to drop the column `attachmentId` on the `Expression` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expression" DROP COLUMN "attachmentId",
ADD COLUMN     "sourceKey" TEXT;
