import { verifyJwt } from "@huginn/backend-shared";
import { getApplicationCatalogRevision, Prisma, prismaBase, selectKnownGame, selectMatcherWithGame } from "@huginn/backend-shared/database";
import { type APIGetApplicationCatalogResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { filterApplicationMatcher, filterKnownGame } from "#utils/helpers";

const querySchema = t.Object({ cursor: t.Optional(t.String()) });

export const getKnownApplications = new Elysia().use(verifyJwt()).get(
   "/api/applications/catalog",
   async ({ status, query: { cursor } }) => {
      const requestedCursor = cursor === undefined ? undefined : BigInt(cursor);

      const json = await prismaBase.$transaction(
         async (tx): Promise<APIGetApplicationCatalogResult> => {
            const revision = await getApplicationCatalogRevision(tx);
            const full = requestedCursor === undefined || requestedCursor > revision;

            if (full) {
               const [games, matchers] = await Promise.all([
                  tx.knownGame.findMany({
                     where: { deletedAt: null },
                     select: selectKnownGame,
                  }),
                  tx.applicationMatcher.findMany({
                     where: {
                        status: "verified",
                        deletedAt: null,
                        knownGame: { deletedAt: null },
                     },
                     select: selectMatcherWithGame,
                  }),
               ]);

               return {
                  cursor: revision.toString(),
                  full: true,
                  games: games.map((game) => filterKnownGame(game)),
                  matchers: matchers.map((matcher) => filterApplicationMatcher(matcher)),
                  deletedGameIds: [],
                  deletedMatcherIds: [],
               };
            }

            const [changedGames, changedMatchers] = await Promise.all([
               tx.knownGame.findMany({
                  where: { revision: { gt: requestedCursor, lte: revision } },
                  select: { ...selectKnownGame, deletedAt: true },
               }),
               tx.applicationMatcher.findMany({
                  where: { revision: { gt: requestedCursor, lte: revision } },
                  select: { ...selectMatcherWithGame, deletedAt: true },
               }),
            ]);

            const games = new Map(changedGames.filter((game) => game.deletedAt === null).map((game) => [game.id, filterKnownGame(game)]));
            const matchers = changedMatchers.filter(
               (matcher) => matcher.deletedAt === null && matcher.status === "verified" && matcher.knownGame.deletedAt === null,
            );

            for (const matcher of matchers) {
               games.set(matcher.knownGame.id, filterKnownGame(matcher.knownGame));
            }

            return {
               cursor: revision.toString(),
               full: false,
               games: [...games.values()],
               matchers: matchers.map((matcher) => filterApplicationMatcher(matcher)),
               deletedGameIds: changedGames.filter((game) => game.deletedAt !== null).map((game) => game.id),
               deletedMatcherIds: changedMatchers.filter((matcher) => matcher.deletedAt !== null || matcher.status !== "verified").map((matcher) => matcher.id),
            };
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );

      return status("OK", json);
   },
   { query: querySchema },
);
