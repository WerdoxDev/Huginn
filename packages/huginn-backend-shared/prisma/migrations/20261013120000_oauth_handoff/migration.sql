CREATE TABLE "OAuthHandoff" (
    "codeHash" TEXT NOT NULL,
    "userId" BIGINT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OAuthHandoff_pkey" PRIMARY KEY ("codeHash")
);

CREATE INDEX "OAuthHandoff_expiresAt_idx" ON "OAuthHandoff"("expiresAt");
ALTER TABLE "OAuthHandoff" ADD CONSTRAINT "OAuthHandoff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
