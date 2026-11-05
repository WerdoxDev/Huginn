import type {
   APIPostAcceptGameContributionJSONBody,
   APIPostAcceptGameContributionResult,
   APIGetApplicationCatalogResult,
   APIGetUserContributionsResult,
} from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, UserFlags } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

import type { TestUser } from "#tests/utils";

import { authHeader, createTestUsers } from "#tests/utils";
import * as igdb from "#utils/igdb";
import * as serverRequest from "#utils/server-request";

describe("accepting contributions with matcher icons", () => {
   let user: TestUser;
   let igdbId: number;
   const rules = { exeNames: ["game.exe"], windowTitles: ["Shared game"], commandLinePatterns: [] as string[] };

   beforeEach(async () => {
      [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      igdbId = 1_000_000_000 + Math.floor(Math.random() * 1_000_000_000);
      spyOn(igdb, "getIGDBGame").mockResolvedValue({ id: igdbId, name: "Shared game" });
      spyOn(serverRequest, "cdnFetch").mockResolvedValue(new ArrayBuffer(1));
      spyOn(serverRequest, "cdnUpload").mockResolvedValue(undefined);
   });

   afterEach(async () => {
      mock.restore();
      await prisma.contribution.deleteMany({ where: { contributorId: user.id } });
      await prisma.applicationMatcher.deleteMany({ where: { knownGame: { igdbId } } });
      await prisma.knownGame.deleteMany({ where: { igdbId } });
   });

   async function accept(iconHash: string | null, matcherRules: Partial<APIPostAcceptGameContributionJSONBody> = {}) {
      const contribution = await prisma.contribution.create({
         data: {
            windowTitle: "Shared game",
            cleanedWindowTitle: "Shared game",
            exePath: "/games/game.exe",
            platform: "linux",
            contributorId: user.id,
            iconHash,
         },
      });
      return (await testHandler(`/api/staff/game-contributions/${contribution.id}/accept`, authHeader(user.accessToken), "POST", {
         igdbId,
         ...rules,
         ...matcherRules,
      })) as APIPostAcceptGameContributionResult;
   }

   test.each(["windowTitles", "commandLinePatterns", "iconHash"] as const)("keeps overlapping matchers separate when %s differs", async (difference) => {
      const original = await accept("global-icon");
      const snapshot = (await testHandler("/api/applications/catalog", authHeader(user.accessToken), "GET")) as APIGetApplicationCatalogResult;
      const regional = await accept(difference === "iconHash" ? "regional-icon" : "global-icon", {
         ...(difference === "windowTitles" ? { windowTitles: ["Regional title"] } : {}),
         ...(difference === "commandLinePatterns" ? { commandLinePatterns: ["--region=jp"] } : {}),
      });

      expect(regional.game.id).toBe(original.game.id);
      expect(regional.game).not.toHaveProperty("iconHash");
      expect(regional.matcher.id).not.toBe(original.matcher.id);
      expect(regional.matcher.iconHash).toBe(difference === "iconHash" ? "regional-icon" : "global-icon");
      const storedOriginal = await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: original.matcher.id } });
      expect(storedOriginal.iconHash).toBe("global-icon");
      expect(storedOriginal.windowTitles).toEqual(["Shared game"]);
      expect(storedOriginal.commandLinePatterns).toEqual([]);
      expect(serverRequest.cdnUpload).toHaveBeenLastCalledWith(CDNRoutes.uploadApplicationIcon(original.game.id), {
         files: [{ data: expect.any(ArrayBuffer), name: regional.matcher.iconHash }],
      });

      const delta = (await testHandler(
         `/api/applications/catalog?cursor=${snapshot.cursor}`,
         authHeader(user.accessToken),
         "GET",
      )) as APIGetApplicationCatalogResult;
      expect(delta.full).toBeFalse();
      expect(delta.matchers).toEqual([regional.matcher]);
      expect(delta.games.find((game) => game.id === regional.game.id)).not.toHaveProperty("iconHash");
      const contributions = (await testHandler("/api/applications/contributions/@me", authHeader(user.accessToken), "GET")) as APIGetUserContributionsResult;
      expect(contributions.map((contribution) => contribution.applicationMatcherId).sort()).toEqual([original.matcher.id, regional.matcher.id].sort());
   });

   test("reuses equivalent rules regardless of ordering, fills a missing icon, and preserves it on iconless submissions", async () => {
      const original = await accept(null, { exeNames: ["game.exe", "regional/game.exe"] });
      expect(original.matcher.iconHash).toBeNull();
      const updated = await accept("regional-icon", { exeNames: ["regional\\game.exe", "game.exe"] });
      expect(updated.matcher.id).toBe(original.matcher.id);
      expect(updated.matcher.iconHash).toBe("regional-icon");
      const iconless = await accept(null, { exeNames: ["game.exe", "regional/game.exe"] });
      expect(iconless.matcher.id).toBe(original.matcher.id);
      expect(iconless.matcher.iconHash).toBe("regional-icon");
      expect(serverRequest.cdnUpload).toHaveBeenCalledTimes(1);
   });

   test("creates an iconless matcher without inheriting a sibling's icon", async () => {
      const original = await accept("global-icon");
      const regional = await accept(null, { exeNames: ["regional.exe"] });

      expect(regional.game.id).toBe(original.game.id);
      expect(regional.matcher.iconHash).toBeNull();
      expect(regional.matcher.id).not.toBe(original.matcher.id);
      expect(serverRequest.cdnUpload).toHaveBeenCalledTimes(1);
   });
});
