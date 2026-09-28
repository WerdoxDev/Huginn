import { cleanApplicationTitle } from "@huginnjs/shared";
import { describe, expect, test } from "vitest";

describe("cleanApplicationTitle", () => {
   test("normalizes compatibility characters, marks, controls, and whitespace", () => {
      expect(cleanApplicationTitle("  Ｇａｍｅ™\n\tTitle  ")).toBe("Game Title");
   });

   test("preserves meaningful title punctuation and suffixes", () => {
      expect(cleanApplicationTitle('NieR:Automata - "Game of the YoRHa Edition"')).toBe('NieR:Automata - "Game of the YoRHa Edition"');
   });
});
