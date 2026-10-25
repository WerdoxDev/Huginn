-- Older Google signups did not persist email verification. Google's account
-- identifier is its verified email; only backfill when it matches the current
-- Huginn email. GitHub identifiers are usernames, so those require a fresh login.
UPDATE "User"
SET "emailVerifiedAt" = CURRENT_TIMESTAMP
WHERE "emailVerifiedAt" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "IdentityProvider"
    WHERE "IdentityProvider"."userId" = "User"."id"
      AND "IdentityProvider"."completed" = true
      AND "IdentityProvider"."providerType" = 'google'
      AND LOWER("IdentityProvider"."accountIdentifier") = LOWER("User"."email")
  );
