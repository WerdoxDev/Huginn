BEGIN;

CREATE TABLE "Expression" (
  "kind" TEXT NOT NULL, "type" SMALLINT NOT NULL, "id" TEXT NOT NULL,
  "title" TEXT NOT NULL, "url" TEXT NOT NULL, "src" TEXT NOT NULL, "contentType" TEXT NOT NULL,
  "width" INTEGER NOT NULL, "height" INTEGER NOT NULL, "attachmentId" BIGINT,
  CONSTRAINT "Expression_pkey" PRIMARY KEY ("kind", "type", "id")
);
CREATE TABLE "UserExpression" (
  "userId" BIGINT NOT NULL, "kind" TEXT NOT NULL, "type" SMALLINT NOT NULL, "expressionId" TEXT NOT NULL,
  "usageCount" INTEGER NOT NULL DEFAULT 0, "lastUsedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserExpression_pkey" PRIMARY KEY ("userId", "kind", "type", "expressionId"),
  CONSTRAINT "UserExpression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserExpression_expression_fkey" FOREIGN KEY ("kind", "type", "expressionId") REFERENCES "Expression"("kind", "type", "id") ON UPDATE CASCADE
);
CREATE INDEX "UserExpression_userId_kind_usageCount_lastUsedAt_idx" ON "UserExpression"("userId", "kind", "usageCount", "lastUsedAt");
ALTER TABLE "Message" ADD COLUMN "gifs" JSONB NOT NULL DEFAULT '[]';

-- Preserve the previous collections, sharing immutable assets between users.
CREATE TEMP TABLE migrated_gifs ON COMMIT DROP AS
SELECT *, CASE WHEN "type" = 1 THEN substring("url" from 'gifs/([0-9]+)\.gif')
  WHEN "url" ~ '^https://klipy.com/gifs/[a-zA-Z0-9_-]+/?$' THEN regexp_replace("url", '^https://klipy.com/gifs/([a-zA-Z0-9_-]+)/?$', '\1')
  ELSE 'legacy_' || "id"::text END AS media_id
FROM "FavoriteGif";
INSERT INTO "Expression" SELECT DISTINCT ON ("type", media_id)
  'gifs', "type", media_id, 'GIF', "url", "src", "contentType", "width", "height", "attachmentId"
FROM migrated_gifs WHERE media_id IS NOT NULL ORDER BY "type", media_id, "id" DESC;
INSERT INTO "UserExpression" ("userId", "kind", "type", "expressionId")
SELECT DISTINCT "userId", 'gifs', "type", media_id FROM migrated_gifs WHERE media_id IS NOT NULL;
INSERT INTO "Expression" SELECT 'stickers', 1, "id"::text, "title", "asset", "asset", 'image/webp', "width", "height", NULL FROM "Sticker";
INSERT INTO "UserExpression" ("userId", "kind", "type", "expressionId", "createdAt")
SELECT "userId", 'stickers', 1, "id"::text, "createdAt" FROM "Sticker";

-- Older sticker messages carry snapshots. Preserve those even after their uploader removed them.
INSERT INTO "Expression"
SELECT DISTINCT ON (item->>'source', item->>'id') 'stickers',
 CASE WHEN item->>'source' = 'custom' THEN 1 ELSE 0 END::smallint,
 item->>'id', COALESCE(item->>'title', 'Sticker'), item->>'url', item->>'src',
 CASE WHEN item->>'source' = 'custom' THEN 'image/webp' WHEN item->>'src' LIKE '%.gif%' THEN 'image/gif' ELSE 'image/webp' END,
 (item->>'width')::integer, (item->>'height')::integer, NULL::bigint
FROM "Message" CROSS JOIN LATERAL jsonb_array_elements("stickers") item
WHERE item ? 'source' ON CONFLICT DO NOTHING;
UPDATE "Message" m SET "stickers" = (
 SELECT COALESCE(jsonb_agg(jsonb_build_object('id', item->>'id', 'type', CASE WHEN item->>'source' = 'custom' THEN 1 ELSE 0 END)), '[]')
 FROM jsonb_array_elements(m."stickers") item
);

-- Move old uploaded GIF embeds into the new reference path so they can be re-signed.
INSERT INTO "Expression"
SELECT DISTINCT ON (substring(t."url" from '^gifs/([0-9]+)\.gif'))
 'gifs', 1, substring(t."url" from '^gifs/([0-9]+)\.gif'), 'GIF', split_part(t."url", '?', 1), split_part(t."url", '?', 1),
 'image/gif', COALESCE(t."width", 1), COALESCE(t."height", 1), NULL::bigint
FROM "Embed" e JOIN "Thumbnail" t ON t."embedId" = e."id"
WHERE t."url" ~ '^gifs/[0-9]+\.gif' ON CONFLICT DO NOTHING;
UPDATE "Message" m SET "gifs" = refs.items,
 "content" = CASE WHEN m."content" = ANY(refs.urls) THEN '' ELSE m."content" END
FROM (
 SELECT e."messageId", jsonb_agg(jsonb_build_object('id', substring(t."url" from '^gifs/([0-9]+)\.gif'), 'type', 1)) AS items,
 array_agg(e."url") AS urls
 FROM "Embed" e JOIN "Thumbnail" t ON t."embedId" = e."id" WHERE t."url" ~ '^gifs/[0-9]+\.gif' GROUP BY e."messageId"
) refs WHERE m."id" = refs."messageId";
DELETE FROM "Embed" e USING "Thumbnail" t WHERE t."embedId" = e."id" AND t."url" ~ '^gifs/[0-9]+\.gif';
UPDATE "UserExpression" u SET "usageCount" = usage.count, "lastUsedAt" = usage.last_used
FROM (
 SELECT m."authorId", refs.kind, (item->>'type')::smallint AS type, item->>'id' AS id,
 COUNT(DISTINCT m."id")::integer AS count, MAX(m."timestamp") AS last_used
 FROM "Message" m CROSS JOIN LATERAL (VALUES ('gifs', m."gifs"), ('stickers', m."stickers")) refs(kind, items)
 CROSS JOIN LATERAL jsonb_array_elements(refs.items) item
 GROUP BY m."authorId", refs.kind, (item->>'type')::smallint, item->>'id'
) usage WHERE u."userId" = usage."authorId" AND u.kind = usage.kind AND u.type = usage.type AND u."expressionId" = usage.id;
DROP TABLE "FavoriteGif";
DROP TABLE "Sticker";

COMMIT;
