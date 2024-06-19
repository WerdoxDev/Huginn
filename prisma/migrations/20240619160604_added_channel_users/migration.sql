-- CreateTable
CREATE TABLE "_channel_recipients" (
    "A" BIGINT NOT NULL,
    "B" BIGINT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_channel_recipients_AB_unique" ON "_channel_recipients"("A", "B");

-- CreateIndex
CREATE INDEX "_channel_recipients_B_index" ON "_channel_recipients"("B");

-- AddForeignKey
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_channel_recipients" ADD CONSTRAINT "_channel_recipients_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
