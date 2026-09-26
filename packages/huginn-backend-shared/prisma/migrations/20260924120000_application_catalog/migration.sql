-- CreateEnum
CREATE TYPE "ApplicationMatcherStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "ApplicationVerificationMethod" AS ENUM ('exact_title', 'fuzzy_title', 'external_id', 'manual', 'legacy');

-- CreateEnum
CREATE TYPE "ContributionStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- Catalog revisions are allocated while holding a transaction-scoped advisory
-- lock. This keeps committed catalog mutations in revision order without a
-- separate state table.
CREATE SEQUENCE "ApplicationCatalogRevision_seq" AS BIGINT START WITH 1;

-- CreateTable
CREATE TABLE "KnownGame" (
    "id" SERIAL NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "aliases" TEXT[] NOT NULL,
    "revision" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "KnownGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationMatcher" (
    "id" SERIAL NOT NULL,
    "knownGameId" INTEGER NOT NULL,
    "exeNames" TEXT[] NOT NULL,
    "windowTitles" TEXT[] NOT NULL,
    "platform" TEXT NOT NULL,
    "status" "ApplicationMatcherStatus" NOT NULL DEFAULT 'pending',
    "verificationMethod" "ApplicationVerificationMethod" NOT NULL,
    "contributorId" BIGINT,
    "commandLinePatterns" TEXT[] NOT NULL,
    "revision" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ApplicationMatcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" SERIAL NOT NULL,
    "windowTitle" TEXT NOT NULL,
    "cleanedWindowTitle" TEXT NOT NULL,
    "exePath" TEXT NOT NULL,
    "commandLine" TEXT,
    "platform" TEXT NOT NULL,
    "status" "ContributionStatus" NOT NULL DEFAULT 'pending',
    "contributorId" BIGINT,
    "knownGameId" INTEGER,
    "applicationMatcherId" INTEGER,
    "legacyData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- Migrate the canonical IGDB records. The first stored name was canonical in
-- the old writer; remaining names become aliases.
INSERT INTO "KnownGame" ("igdbId", "canonicalName", "aliases", "revision", "createdAt", "updatedAt", "deletedAt")
SELECT DISTINCT ON (source."igdbId")
    source."igdbId",
    source."canonicalName",
    source."aliases",
    nextval('"ApplicationCatalogRevision_seq"'),
    source."createdAt",
    source."updatedAt",
    source."deletedAt"
FROM (
    SELECT
        "igdbId",
        COALESCE(("names")[1], 'Unknown') AS "canonicalName",
        CASE
            WHEN cardinality(COALESCE("names", ARRAY[]::TEXT[])) > 1
                THEN ("names")[2:cardinality("names")]
            ELSE ARRAY[]::TEXT[]
        END AS "aliases",
        "createdAt",
        "updatedAt",
        "deletedAt",
        "active"
    FROM "KnownApplication"
    WHERE "igdbId" IS NOT NULL
) AS source
ORDER BY source."igdbId", source."deletedAt" NULLS FIRST, source."active" DESC, source."createdAt" ASC;

-- Preserve every old IGDB-backed executable mapping. Existing name arrays are
-- retained as exact window-title candidates to avoid regressing old clients.
INSERT INTO "ApplicationMatcher" (
    "id",
    "knownGameId",
    "exeNames",
    "windowTitles",
    "platform",
    "status",
    "verificationMethod",
    "contributorId",
    "commandLinePatterns",
    "revision",
    "createdAt",
    "updatedAt",
    "deletedAt"
)
SELECT
    application."id",
    game."id",
    ARRAY[application."exeName"],
    COALESCE(application."names", ARRAY[]::TEXT[]),
    'unknown',
    CASE WHEN application."active" THEN 'verified' ELSE 'pending' END::"ApplicationMatcherStatus",
    'legacy'::"ApplicationVerificationMethod",
    application."contributorId",
    COALESCE(application."commandLinePatterns", ARRAY[]::TEXT[]),
    nextval('"ApplicationCatalogRevision_seq"'),
    application."createdAt",
    application."updatedAt",
    application."deletedAt"
FROM "KnownApplication" AS application
INNER JOIN "KnownGame" AS game ON game."igdbId" = application."igdbId";

-- The old table did not retain the original full path, command line, platform,
-- or accepted raw title. Keep the recoverable values and mark them as legacy.
INSERT INTO "Contribution" (
    "id",
    "windowTitle",
    "cleanedWindowTitle",
    "exePath",
    "commandLine",
    "platform",
    "status",
    "contributorId",
    "knownGameId",
    "applicationMatcherId",
    "legacyData",
    "createdAt",
    "updatedAt"
)
SELECT
    application."id",
    COALESCE((application."names")[1], ''),
    COALESCE((application."names")[1], ''),
    application."exeName",
    NULL,
    'unknown',
    CASE WHEN application."active" THEN 'accepted' ELSE 'pending' END::"ContributionStatus",
    application."contributorId",
    game."id",
    matcher."id",
    true,
    application."createdAt",
    application."updatedAt"
FROM "KnownApplication" AS application
LEFT JOIN "KnownGame" AS game ON game."igdbId" = application."igdbId"
LEFT JOIN "ApplicationMatcher" AS matcher ON matcher."id" = application."id";

SELECT setval(
    pg_get_serial_sequence('"ApplicationMatcher"', 'id'),
    COALESCE((SELECT MAX("id") FROM "ApplicationMatcher"), 1),
    EXISTS (SELECT 1 FROM "ApplicationMatcher")
);

SELECT setval(
    pg_get_serial_sequence('"Contribution"', 'id'),
    COALESCE((SELECT MAX("id") FROM "Contribution"), 1),
    EXISTS (SELECT 1 FROM "Contribution")
);

-- DropTable
DROP TABLE "KnownApplication";

-- CreateIndex
CREATE UNIQUE INDEX "KnownGame_igdbId_key" ON "KnownGame"("igdbId");
CREATE INDEX "KnownGame_aliases_idx" ON "KnownGame" USING GIN ("aliases");
CREATE INDEX "KnownGame_revision_idx" ON "KnownGame"("revision");
CREATE INDEX "ApplicationMatcher_knownGameId_idx" ON "ApplicationMatcher"("knownGameId");
CREATE INDEX "ApplicationMatcher_exeNames_idx" ON "ApplicationMatcher" USING GIN ("exeNames");
CREATE INDEX "ApplicationMatcher_status_idx" ON "ApplicationMatcher"("status");
CREATE INDEX "ApplicationMatcher_revision_idx" ON "ApplicationMatcher"("revision");
CREATE INDEX "Contribution_contributorId_idx" ON "Contribution"("contributorId");
CREATE INDEX "Contribution_knownGameId_idx" ON "Contribution"("knownGameId");
CREATE INDEX "Contribution_applicationMatcherId_idx" ON "Contribution"("applicationMatcherId");
CREATE INDEX "Contribution_status_idx" ON "Contribution"("status");

-- AddForeignKey
ALTER TABLE "ApplicationMatcher" ADD CONSTRAINT "ApplicationMatcher_knownGameId_fkey" FOREIGN KEY ("knownGameId") REFERENCES "KnownGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationMatcher" ADD CONSTRAINT "ApplicationMatcher_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_knownGameId_fkey" FOREIGN KEY ("knownGameId") REFERENCES "KnownGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_applicationMatcherId_fkey" FOREIGN KEY ("applicationMatcherId") REFERENCES "ApplicationMatcher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
