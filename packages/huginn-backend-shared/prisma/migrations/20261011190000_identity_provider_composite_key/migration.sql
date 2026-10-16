DROP INDEX "IdentityProvider_providerUserId_key";

CREATE UNIQUE INDEX "IdentityProvider_providerType_providerUserId_key"
ON "IdentityProvider"("providerType", "providerUserId");
