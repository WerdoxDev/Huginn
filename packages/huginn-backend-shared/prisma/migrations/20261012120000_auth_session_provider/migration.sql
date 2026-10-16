ALTER TABLE "AuthSession" ADD COLUMN "authProvider" TEXT;

-- Google is the only OAuth sign-in provider currently available. Attribute
-- sessions created before this column existed so disconnecting Google revokes them.
UPDATE "AuthSession"
SET "authProvider" = CASE
   WHEN "authType" = 'oauth' THEN 'google'
   WHEN "authType" IN ('google', 'github') THEN "authType"
   ELSE NULL
END
WHERE "authType" IN ('oauth', 'google', 'github');
