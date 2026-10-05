import type { APIGetStaffKnownGamesResult, APIStaffKnownGame } from "@huginnjs/shared";

import { prisma, selectApplicationMatcher, selectKnownGame } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { filterApplicationMatcher, filterKnownGame } from "#utils/helpers";
import { verifyStaff } from "#utils/staff";

export const getStaffKnownGames = new Elysia().use(verifyStaff()).get("/api/staff/known-games", async ({ status }) => {
   const games = await prisma.knownGame.findMany({
      where: { deletedAt: null },
      orderBy: { canonicalName: "asc" },
      select: {
         ...selectKnownGame,
         applicationMatchers: {
            where: { deletedAt: null },
            orderBy: { id: "asc" },
            select: selectApplicationMatcher,
         },
      },
   });

   const json: APIGetStaffKnownGamesResult = {
      games: games.map((game): APIStaffKnownGame => ({
         ...filterKnownGame(game),
         matchers: game.applicationMatchers.map((matcher) => filterApplicationMatcher(matcher)),
      })),
   };

   return status("OK", json);
});
