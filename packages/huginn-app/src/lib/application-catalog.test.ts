import type { APIApplicationMatcher, APIGetKnownApplicationsResult, APIKnownGame } from "@huginnjs/shared";

import { describe, expect, test } from "vitest";

import { applyApplicationCatalogUpdate } from "./application-catalog";

const game = (id: number, name: string): APIKnownGame => ({
   id,
   igdbId: id * 10,
   canonicalName: name,
   aliases: [],
   createdAt: "2026-01-01T00:00:00.000Z",
   updatedAt: null,
});

const matcher = (id: number, knownGameId: number): APIApplicationMatcher => ({
   id,
   knownGameId,
   exeNames: [`game-${id}.exe`],
   windowTitles: [],
   platform: "win32",
   status: "verified",
   verificationMethod: "exact_title",
   commandLinePatterns: [],
   createdAt: "2026-01-01T00:00:00.000Z",
   updatedAt: null,
});

const catalog = (options: Partial<APIGetKnownApplicationsResult> = {}): APIGetKnownApplicationsResult => ({
   cursor: "0",
   full: true,
   games: [],
   matchers: [],
   deletedGameIds: [],
   deletedMatcherIds: [],
   ...options,
});

describe("applyApplicationCatalogUpdate", () => {
   test("applies idempotent upserts and advances the cursor", () => {
      const cached = catalog({ cursor: "1", games: [game(1, "Old name")], matchers: [matcher(1, 1)] });
      const delta = catalog({ cursor: "2", full: false, games: [game(1, "New name")], matchers: [matcher(1, 1)] });

      expect(applyApplicationCatalogUpdate(cached, delta)).toEqual(catalog({ cursor: "2", games: [game(1, "New name")], matchers: [matcher(1, 1)] }));
   });

   test("removes tombstoned games and their matchers", () => {
      const cached = catalog({ cursor: "1", games: [game(1, "Game")], matchers: [matcher(1, 1)] });
      const delta = catalog({ cursor: "2", full: false, deletedGameIds: [1] });

      expect(applyApplicationCatalogUpdate(cached, delta)).toEqual(catalog({ cursor: "2" }));
   });

   test("replaces local state when the server requests a full refresh", () => {
      const cached = catalog({ cursor: "4", games: [game(1, "Old")], matchers: [matcher(1, 1)] });
      const snapshot = catalog({ cursor: "2", games: [game(2, "Fresh")], matchers: [matcher(2, 2)] });

      expect(applyApplicationCatalogUpdate(cached, snapshot)).toEqual(snapshot);
   });
});
