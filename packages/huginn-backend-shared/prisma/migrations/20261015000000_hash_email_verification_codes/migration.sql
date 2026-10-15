-- Existing six-digit codes cannot be converted without the application secret.
-- Users can request a new code after this migration.
DELETE FROM "EmailVerification";
ALTER TABLE "EmailVerification" RENAME COLUMN "code" TO "codeHash";
