-- Keep the existing game-scoped CDN paths. Only transfer an icon when its
-- owner is unambiguous, counting every matcher (including deleted matchers).
DO $$
DECLARE
    catalog_revision BIGINT;
BEGIN
    PERFORM pg_advisory_xact_lock(4821947331);

    ALTER TABLE "ApplicationMatcher" ADD COLUMN "iconHash" TEXT;
    catalog_revision := nextval('"ApplicationCatalogRevision_seq"');

    WITH matcher_counts AS (
        SELECT "knownGameId", COUNT(*) AS total
        FROM "ApplicationMatcher"
        GROUP BY "knownGameId"
    )
    UPDATE "ApplicationMatcher" AS matcher
    SET "iconHash" = CASE WHEN matcher_counts.total = 1 THEN game."iconHash" ELSE NULL END,
        "revision" = catalog_revision,
        "updatedAt" = CURRENT_TIMESTAMP
    FROM "KnownGame" AS game
    JOIN matcher_counts ON matcher_counts."knownGameId" = game."id"
    WHERE matcher."knownGameId" = game."id";

    ALTER TABLE "KnownGame" DROP COLUMN "iconHash";

    -- Resend both record types so existing catalog caches replace the old
    -- game objects and receive an explicit iconHash, including null, per matcher.
    UPDATE "KnownGame"
    SET "revision" = catalog_revision,
        "updatedAt" = CURRENT_TIMESTAMP;
END $$;
