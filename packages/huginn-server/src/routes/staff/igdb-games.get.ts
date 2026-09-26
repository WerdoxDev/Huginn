import type { APIGetStaffIGDBGamesResult } from "@huginnjs/shared";

import Elysia, { t } from "elysia";

import { searchIGDBGames, toIGDBCandidate } from "#utils/igdb";
import { verifyStaff } from "#utils/staff";

const querySchema = t.Object({ query: t.String({ minLength: 2, maxLength: 100 }) });

export const getStaffIGDBGames = new Elysia().use(verifyStaff()).get(
   "/api/staff/igdb-games",
   async ({ query, status }) => {
      const games = await searchIGDBGames(query.query);
      const json: APIGetStaffIGDBGamesResult = { games: games.map(toIGDBCandidate) };
      return status("OK", json);
   },
   { query: querySchema },
);
