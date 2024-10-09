-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Relationship" DROP CONSTRAINT "Relationship_userId_fkey";

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
