CREATE UNIQUE INDEX "IdentityProvider_userId_providerType_key"
ON "IdentityProvider"("userId", "providerType");
