/*
  Warnings:

  - The primary key for the `AuthSession` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `AuthSession` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AuthSession" DROP CONSTRAINT "AuthSession_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" BIGINT NOT NULL,
ADD CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id");
