import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";

const migration = new URL("../../../../huginn-backend-shared/prisma/migrations/20261101120000_matcher_icons/migration.sql", import.meta.url);

describe("matcher icon migration", () => {
   test("transfers icons only for games with exactly one matcher and refreshes every catalog record", async () => {
      const sql = await Bun.file(migration).text();
      await prisma.$transaction(async (tx) => {
         // Shadow production tables and the revision sequence for this connection.
         await tx.$executeRawUnsafe(`CREATE TEMP TABLE "KnownGame" (
            "id" INTEGER, "iconHash" TEXT, "revision" BIGINT, "updatedAt" TIMESTAMP(3)
         ) ON COMMIT DROP`);
         await tx.$executeRawUnsafe(`CREATE TEMP TABLE "ApplicationMatcher" (
            "id" INTEGER, "knownGameId" INTEGER, "revision" BIGINT,
            "updatedAt" TIMESTAMP(3), "deletedAt" TIMESTAMP(3), "status" TEXT
         ) ON COMMIT DROP`);
         await tx.$executeRawUnsafe('CREATE TEMP SEQUENCE "ApplicationCatalogRevision_seq" START WITH 50');
         await tx.$executeRawUnsafe(`INSERT INTO "KnownGame" ("id", "iconHash", "revision") VALUES
            (1, 'single-icon', 1), (2, 'ambiguous-icon', 2), (3, 'no-matchers', 3),
            (4, NULL, 4), (5, 'deleted-only-icon', 5), (6, 'active-and-deleted', 6), (7, 'pending-icon', 7)`);
         await tx.$executeRawUnsafe(`INSERT INTO "ApplicationMatcher" ("id", "knownGameId", "revision", "deletedAt", "status") VALUES
            (1, 1, 1, NULL, 'verified'), (2, 2, 2, NULL, 'verified'), (3, 2, 2, NULL, 'verified'),
            (4, 4, 4, NULL, 'verified'), (5, 5, 5, CURRENT_TIMESTAMP, 'verified'),
            (6, 6, 6, NULL, 'verified'), (7, 6, 6, CURRENT_TIMESTAMP, 'rejected'), (8, 7, 7, NULL, 'pending')`);

         await tx.$executeRawUnsafe(sql);

         const matchers = await tx.$queryRawUnsafe<{ id: number; iconHash: string | null; revision: bigint; updatedAt: Date }[]>(
            'SELECT "id", "iconHash", "revision", "updatedAt" FROM "ApplicationMatcher" ORDER BY "id"',
         );
         expect(matchers.map((matcher) => matcher.iconHash)).toEqual(["single-icon", null, null, null, "deleted-only-icon", null, null, "pending-icon"]);
         const games = await tx.$queryRawUnsafe<{ id: number; revision: bigint; updatedAt: Date }[]>('SELECT * FROM "KnownGame" ORDER BY "id"');
         expect(games).toHaveLength(7);
         for (const record of [...games, ...matchers]) {
            expect(record.revision).toBe(50n);
            expect(record.updatedAt).toBeInstanceOf(Date);
         }
         for (const game of games) expect(game).not.toHaveProperty("iconHash");
         await tx.$executeRawUnsafe('DROP SEQUENCE "ApplicationCatalogRevision_seq"');
      });
   });
});
