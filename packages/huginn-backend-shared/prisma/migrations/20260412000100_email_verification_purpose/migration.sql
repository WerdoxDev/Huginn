ALTER TABLE "EmailVerification"
ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'email_change';
