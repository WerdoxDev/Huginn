import type { APIGetKnownApplicationsResult } from "@huginnjs/shared";

function persistedCatalog(result: APIGetKnownApplicationsResult): APIGetKnownApplicationsResult {
   return {
      cursor: result.cursor,
      full: true,
      games: result.games,
      matchers: result.matchers,
      deletedGameIds: [],
      deletedMatcherIds: [],
   };
}

export function applyApplicationCatalogUpdate(
   cached: APIGetKnownApplicationsResult | undefined,
   result: APIGetKnownApplicationsResult,
): APIGetKnownApplicationsResult {
   if (!cached || result.full) return persistedCatalog(result);

   const games = new Map(cached.games.map((game) => [game.id, game]));
   const matchers = new Map(cached.matchers.map((matcher) => [matcher.id, matcher]));

   for (const game of result.games) games.set(game.id, game);
   for (const matcher of result.matchers) matchers.set(matcher.id, matcher);
   for (const gameId of result.deletedGameIds) games.delete(gameId);
   for (const matcherId of result.deletedMatcherIds) matchers.delete(matcherId);

   if (result.deletedGameIds.length > 0) {
      const deletedGameIds = new Set(result.deletedGameIds);
      for (const [matcherId, matcher] of matchers) {
         if (deletedGameIds.has(matcher.knownGameId)) matchers.delete(matcherId);
      }
   }

   return {
      cursor: result.cursor,
      full: true,
      games: [...games.values()],
      matchers: [...matchers.values()],
      deletedGameIds: [],
      deletedMatcherIds: [],
   };
}
