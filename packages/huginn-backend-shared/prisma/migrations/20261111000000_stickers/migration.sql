CREATE TABLE "Sticker" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "asset" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sticker_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Sticker_userId_id_idx" ON "Sticker"("userId", "id");
ALTER TABLE "Sticker" ADD CONSTRAINT "Sticker_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
