import { cleanApplicationTitle } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import type { IGDBSearchResult } from "#utils/types";

import { findVerifiedIGDBGame } from "#utils/igdb-game-matcher";

function game(overrides: Partial<IGDBSearchResult> & Pick<IGDBSearchResult, "id" | "name">): IGDBSearchResult {
   return {
      rating: 0,
      url: `https://www.igdb.com/games/${overrides.id}`,
      ...overrides,
   };
}

describe("IGDB game-title verification after cleaning", () => {
   test("verifies a canonical IGDB title after Unicode and trademark cleanup", () => {
      const cleanedTitle = cleanApplicationTitle("  ＥＬＤＥＮ　ＲＩＮＧ™\n");
      const match = findVerifiedIGDBGame(cleanedTitle, [game({ id: 1, name: "Elden Ring" })]);

      expect(cleanedTitle).toBe("ELDEN RING");
      expect(match).toMatchObject({ game: { id: 1 }, matchedTitle: "Elden Ring", similarity: 100 });
   });

   test("verifies against an IGDB alternative name", () => {
      const cleanedTitle = cleanApplicationTitle("Rainbow Six Siege®");
      const match = findVerifiedIGDBGame(cleanedTitle, [
         game({
            id: 2,
            name: "Tom Clancy's Rainbow Six Siege",
            alternative_names: [{ name: "Rainbow Six Siege" }],
         }),
      ]);

      expect(match).toMatchObject({ game: { id: 2 }, matchedTitle: "Rainbow Six Siege", similarity: 100 });
   });

   test("verifies against an IGDB localized name", () => {
      const cleanedTitle = cleanApplicationTitle("Like a Dragon: Infinite Wealth©");
      const match = findVerifiedIGDBGame(cleanedTitle, [
         game({
            id: 3,
            name: "Ryu ga Gotoku 8",
            game_localizations: [{ name: "Like a Dragon: Infinite Wealth" }],
         }),
      ]);

      expect(match).toMatchObject({ game: { id: 3 }, matchedTitle: "Like a Dragon: Infinite Wealth", similarity: 100 });
   });

   test("accepts a cleaned title above the fuzzy-match threshold", () => {
      const cleanedTitle = cleanApplicationTitle("The Witcher 3: Wild Hnut™");
      const match = findVerifiedIGDBGame(cleanedTitle, [game({ id: 4, name: "The Witcher 3: Wild Hunt" })]);

      expect(match?.game.id).toBe(4);
      expect(match?.similarity).toBeGreaterThanOrEqual(90);
      expect(match?.similarity).toBeLessThan(100);
   });

   test("does not verify an unrelated title", () => {
      const cleanedTitle = cleanApplicationTitle("Completely Different Launcher");
      const match = findVerifiedIGDBGame(cleanedTitle, [game({ id: 5, name: "Elden Ring" })]);

      expect(match).toBeUndefined();
   });

   test("accepts a subtitle title", () => {
      const cleanedTitle = cleanApplicationTitle("Townfall");
      const match = findVerifiedIGDBGame(cleanedTitle, [game({ id: 6, name: "Silent Hill: Townfall" })]);

      expect(match).toMatchObject({ game: { id: 6 }, matchedTitle: "Silent Hill: Townfall", similarity: 100 });
      });
});
