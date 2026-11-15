/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `Expression` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Expression_sourceKey_key" ON "Expression"("sourceKey");
