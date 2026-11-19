CREATE TABLE "FavoriteGif" (
    "id" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,
    "type" SMALLINT NOT NULL,
    "url" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "attachmentId" BIGINT,
    CONSTRAINT "FavoriteGif_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FavoriteGif_userId_url_key" ON "FavoriteGif"("userId", "url");
CREATE INDEX "FavoriteGif_userId_id_idx" ON "FavoriteGif"("userId", "id");
ALTER TABLE "FavoriteGif" ADD CONSTRAINT "FavoriteGif_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GifType.EXTERNAL = 0. Preserve legacy recency using ascending Snowflake IDs.
WITH legacy AS (
    SELECT s."userId", gif->>'url' AS url, gif->>'src' AS src,
        LEAST(20000, GREATEST(1, (gif->>'width')::numeric))::integer AS width,
        LEAST(20000, GREATEST(1, (gif->>'height')::numeric))::integer AS height,
        CASE WHEN jsonb_typeof(gif->'timestamp') = 'number' AND (gif->>'timestamp')::numeric BETWEEN 0 AND 8640000000000000
             THEN (gif->>'timestamp')::numeric ELSE EXTRACT(EPOCH FROM statement_timestamp()) * 1000 END AS saved_at
    FROM "Settings" s
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(s."json"->'favoriteGifs') = 'array' THEN s."json"->'favoriteGifs' ELSE '[]'::jsonb END
    ) gif
    WHERE jsonb_typeof(gif->'url') = 'string' AND jsonb_typeof(gif->'src') = 'string'
      AND jsonb_typeof(gif->'width') = 'number' AND jsonb_typeof(gif->'height') = 'number'
), distinct_gifs AS (
    SELECT DISTINCT ON ("userId", url) * FROM legacy ORDER BY "userId", url, saved_at DESC
), numbered AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY saved_at, "userId", url) AS n, COUNT(*) OVER () AS total FROM distinct_gifs
)
INSERT INTO "FavoriteGif" ("id", "userId", "type", "url", "src", "contentType", "width", "height")
SELECT
    -- Use the shared 2023 epoch and FAVORITE_GIF worker (19). Allocate past
    -- milliseconds in batches of 4096 so migrated IDs precede new favorites.
    (((FLOOR(EXTRACT(EPOCH FROM statement_timestamp()) * 1000)::bigint - 1672531200000 - total / 4096 - 1 + (n - 1) / 4096) << 22)
        | (19::bigint << 17) | ((n - 1) % 4096)),
    "userId", 0, url, src,
    CASE WHEN split_part(src, '?', 1) ~* '\.(gif|webp|png)$' THEN 'image/gif' ELSE 'video/mp4' END,
    width, height
FROM numbered;

UPDATE "Settings" SET "json" = "json" - 'favoriteGifs' WHERE "json" ? 'favoriteGifs';
