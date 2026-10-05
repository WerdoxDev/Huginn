import type { APIApplicationMatcher, APIGetApplicationCatalogResult, APIKnownGame } from "@huginnjs/shared";

import { describe, expect, test } from "vitest";

import type { ApplicationInfo } from "@/types";

import { detectKnownApplication } from "./presenceStore";

const game = (id: number, canonicalName: string): APIKnownGame => ({
   id,
   igdbId: id,
   canonicalName,
   aliases: [],
   iconHash: null,
   createdAt: "2026-01-01T00:00:00.000Z",
   updatedAt: null,
});

const matcher = (id: number, knownGameId: number, options: Partial<APIApplicationMatcher> = {}): APIApplicationMatcher => ({
   id,
   knownGameId,
   exeNames: [],
   windowTitles: [],
   platform: "unknown",
   status: "verified",
   verificationMethod: "exact_title",
   commandLinePatterns: [],
   createdAt: "2026-01-01T00:00:00.000Z",
   updatedAt: null,
   ...options,
});

const application = (options: Partial<ApplicationInfo> = {}): ApplicationInfo => ({
   processId: 1,
   windowTitle: "",
   icon: null,
   displayName: null,
   ...options,
});

const catalog = (games: APIKnownGame[], matchers: APIApplicationMatcher[]): APIGetApplicationCatalogResult => ({
   cursor: "0",
   full: true,
   games,
   matchers,
   deletedGameIds: [],
   deletedMatcherIds: [],
});

describe("detectKnownApplication", () => {
   test("prefers the matcher with the most matching evidence", () => {
      const games = [game(1, "Generic game"), game(2, "Specific game")];
      const matchers = [matcher(1, 1, { exeNames: ["game.exe"] }), matcher(2, 2, { exeNames: ["game.exe"], windowTitles: ["Specific game"] })];

      const match = detectKnownApplication(
         [application({ exePath: "C:\\Games\\game.exe", windowTitle: "Specific game" })],
         catalog(games, matchers),
         "win32",
      );

      expect(match?.known.game.id).toBe(2);
   });

   test("matches an executable qualified by its parent folder", () => {
      const games = [game(1, "Retail game"), game(2, "Modded game")];
      const matchers = [matcher(1, 1, { exeNames: ["game.exe"] }), matcher(2, 2, { exeNames: ["mods/game.exe"] })];

      const match = detectKnownApplication([application({ exePath: "C:\\Games\\mods\\game.exe" })], catalog(games, matchers), "win32");

      expect(match?.known.game.id).toBe(2);
   });

   test("does not match a qualified executable from another folder", () => {
      const games = [game(1, "Modded game")];
      const matchers = [matcher(1, 1, { exeNames: ["mods/game.exe"] })];

      const match = detectKnownApplication([application({ exePath: "C:\\Games\\retail\\game.exe" })], catalog(games, matchers), "win32");

      expect(match).toBeUndefined();
   });

   test("prefers a matcher with matching command-line constraints", () => {
      const games = [game(1, "Base game"), game(2, "Modded game")];
      const matchers = [matcher(1, 1, { exeNames: ["game.exe"] }), matcher(2, 2, { exeNames: ["game.exe"], commandLinePatterns: ["--modded"] })];

      const match = detectKnownApplication(
         [application({ exePath: "/games/game.exe", cmdLine: "game.exe --modded" })],
         catalog(games, matchers),
         "linux",
      );

      expect(match?.known.game.id).toBe(2);
   });

   test("compares matches across all open applications", () => {
      const games = [game(1, "First game"), game(2, "Best game")];
      const matchers = [
         matcher(1, 1, { exeNames: ["first.exe"] }),
         matcher(2, 2, { exeNames: ["best.exe"], windowTitles: ["Best game"], platform: "win32" }),
      ];

      const match = detectKnownApplication(
         [application({ exePath: "C:\\Games\\first.exe" }), application({ processId: 2, exePath: "C:\\Games\\best.exe", windowTitle: "Best game" })],
         catalog(games, matchers),
         "win32",
      );

      expect(match?.detected.processId).toBe(2);
      expect(match?.known.game.id).toBe(2);
   });
});
