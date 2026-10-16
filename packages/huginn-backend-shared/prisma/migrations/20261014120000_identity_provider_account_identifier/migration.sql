ALTER TABLE "IdentityProvider" ADD COLUMN "accountIdentifier" TEXT;

UPDATE "IdentityProvider"
SET "accountIdentifier" = "User"."email"
FROM "User"
WHERE "IdentityProvider"."userId" = "User"."id";
