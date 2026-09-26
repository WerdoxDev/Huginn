import { calculateSimilarity, CONSTANTS } from "@huginnjs/shared";

import type { IGDBSearchResult, VerifiedIGDBGameMatch } from "#utils/types";

function getTitleSegments(title: string): string[] {
   const cleaned = title.toLocaleLowerCase();

   return [
      cleaned,
      ...cleaned.split(/\s*[:|–—-]\s*/),
   ].filter(Boolean);
}

function isSubtitleMatch(title: string, igdbTitle: string): boolean {
   const observed = title.toLocaleLowerCase();
   const segments = getTitleSegments(igdbTitle);

console.log(segments);
   return  segments.includes(observed) && !CONSTANTS.KNOWN_APPLICATION_IGNORED_SUBTITLES.includes(observed);
}

export function findVerifiedIGDBGame(title: string, games: IGDBSearchResult[]): VerifiedIGDBGameMatch | undefined {
   let bestMatch: VerifiedIGDBGameMatch | undefined;

   for (const game of games) {
      const titles = [
         game.name,
         ...(game.alternative_names ?? []).map((alternative) => alternative.name),
         ...(game.game_localizations ?? []).map((localization) => localization.name),
      ];

      for (const matchedTitle of titles) {
         const similarity = calculateSimilarity(title, matchedTitle);
         const isSubtitle = isSubtitleMatch(title, matchedTitle);
         console.log(`Comparing "${title}" with "${matchedTitle}" (similarity: ${similarity}, isSubtitle: ${isSubtitle})`);

         if (!bestMatch || similarity > bestMatch.similarity || isSubtitle) {
            bestMatch = { game, matchedTitle, similarity, verificationMethod: similarity === 100 ? "exact_title" : isSubtitle ? "subtitle" : "fuzzy_title"};
         }
      }
   }

   return bestMatch && (bestMatch.similarity >= CONSTANTS.KNOWN_APPLICATION_SIMILARITY_THRESHOLD || bestMatch.verificationMethod === "subtitle") ? bestMatch : undefined;
}
