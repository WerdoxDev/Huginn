ALTER TABLE "PasswordReset"
    DROP COLUMN "attempts",
    DROP COLUMN "sentAt",
    DROP COLUMN "sendCount",
    DROP COLUMN "windowStartedAt";
