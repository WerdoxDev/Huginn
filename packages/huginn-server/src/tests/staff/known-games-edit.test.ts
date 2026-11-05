import type { APIApplicationMatcher, APIGetApplicationCatalogResult, APIPatchStaffApplicationMatcherJSONBody, APIStaffKnownGame } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CDNRoutes, getFileHash, toArrayBuffer, UserFlags } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

import type { TestUser } from "#tests/utils";

import { authHeader, createTestUsers, getReadyWebSocket, testIsDispatch } from "#tests/utils";
import { filterApplicationMatcher } from "#utils/helpers";
import * as igdb from "#utils/igdb";
import * as serverRequest from "#utils/server-request";

const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ZkAAAAASUVORK5CYII=";
const rules = { exeNames: ["game.exe"], windowTitles: ["Original title"], commandLinePatterns: [] as string[], platform: "linux" };

describe("editing staff known games", () => {
   let staff: TestUser;
   let game: APIStaffKnownGame;
   let otherGameId: number | undefined;
   let newIGDBId: number;

   beforeEach(async () => {
      [staff] = await createTestUsers(1);
      await prisma.user.update({ where: { id: staff.id }, data: { flags: UserFlags.STAFF } });
      const igdbId = 1_000_000_000 + Math.floor(Math.random() * 900_000_000);
      newIGDBId = igdbId + 1;
      const created = await prisma.knownGame.create({
         data: {
            igdbId,
            canonicalName: "Original game",
            aliases: ["Original alias"],
            revision: 0n,
            applicationMatchers: {
               create: [
                  { ...rules, iconHash: "original-icon", revision: 0n, status: "verified", verificationMethod: "manual" },
                  { ...rules, exeNames: ["sibling.exe"], iconHash: "sibling-icon", revision: 0n, status: "verified", verificationMethod: "manual" },
               ],
            },
         },
         include: { applicationMatchers: { orderBy: { id: "asc" } } },
      });
      game = { ...created, matchers: created.applicationMatchers.map(filterApplicationMatcher) };
      otherGameId = undefined;
      spyOn(igdb, "getIGDBGame").mockResolvedValue({
         id: newIGDBId,
         name: "Corrected game",
         alternative_names: [{ name: "Corrected alias" }, { name: "Corrected game" }],
         game_localizations: [{ name: "Localized game" }, { name: "Corrected alias" }],
      });
      spyOn(serverRequest, "cdnUpload").mockResolvedValue(undefined);
   });

   afterEach(async () => {
      mock.restore();
      await prisma.knownGame.deleteMany({ where: { id: { in: [game.id, ...(otherGameId ? [otherGameId] : [])] } } });
   });

   async function patchMatcher(body: Partial<APIPatchStaffApplicationMatcherJSONBody> = {}, gameId = game.id, matcherId = game.matchers[0].id) {
      return (await testHandler(`/api/staff/known-games/${gameId}/matchers/${matcherId}`, authHeader(staff.accessToken), "PATCH", {
         ...rules,
         ...body,
      })) as APIApplicationMatcher;
   }

   async function catalog(cursor?: string) {
      return (await testHandler(
         `/api/applications/catalog${cursor ? `?cursor=${cursor}` : ""}`,
         authHeader(staff.accessToken),
         "GET",
      )) as APIGetApplicationCatalogResult;
   }

   test("requires a live staff flag for both edits", async () => {
      await prisma.user.update({ where: { id: staff.id }, data: { flags: 0 } });
      await expect(patchMatcher()).rejects.toThrow("Forbidden");
      await expect(testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", { igdbId: newIGDBId })).rejects.toThrow(
         "Forbidden",
      );
   });

   test("updates and normalizes one matcher without changing its sibling or existing icon", async () => {
      const snapshot = await catalog();
      const updated = await patchMatcher({
         exeNames: [" folder\\game.exe ", "folder/game.exe"],
         windowTitles: [" New title ", "New title"],
         commandLinePatterns: [" --region=jp ", "--region=jp"],
         platform: "win32",
      });
      expect(updated).toMatchObject({
         id: game.matchers[0].id,
         iconHash: "original-icon",
         exeNames: ["folder/game.exe"],
         windowTitles: ["New title"],
         commandLinePatterns: ["--region=jp"],
         platform: "win32",
         status: "verified",
         verificationMethod: "manual",
      });
      const sibling = await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: game.matchers[1].id } });
      expect(sibling.exeNames).toEqual(["sibling.exe"]);
      expect(sibling.iconHash).toBe("sibling-icon");
      expect(sibling.revision).toBe(0n);
      expect(serverRequest.cdnUpload).not.toHaveBeenCalled();
      const delta = await catalog(snapshot.cursor);
      expect(delta.full).toBeFalse();
      expect(delta.matchers).toEqual([updated]);
      expect(delta.games.map((candidate) => candidate.id)).toContain(game.id);
   });

   test("uploads an icon only for the edited matcher and publishes it in the catalog", async () => {
      const snapshot = await catalog();
      const updated = await patchMatcher({ icon: png });
      const iconHash = getFileHash(toArrayBuffer(png));
      expect(updated.iconHash).toBe(iconHash);
      expect(serverRequest.cdnUpload).toHaveBeenCalledWith(CDNRoutes.uploadApplicationIcon(game.id), {
         files: [{ data: expect.any(ArrayBuffer), name: iconHash }],
      });
      const delta = await catalog(snapshot.cursor);
      expect(delta.matchers).toEqual([updated]);
      expect((await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: game.matchers[1].id } })).iconHash).toBe("sibling-icon");
   });

   test.each<Partial<APIPatchStaffApplicationMatcherJSONBody>>([
      { exeNames: [], windowTitles: [], commandLinePatterns: ["--alone"] },
      { exeNames: ["a/b/game.exe"] },
      { exeNames: ["../game.exe"] },
      { platform: " " },
      { icon: "not-an-image" },
      { icon: "data:image/png;base64,aGVsbG8=" },
   ])("rejects invalid matcher edits without publishing changes: %j", async (body) => {
      await expect(patchMatcher(body)).rejects.toThrow();
      const unchanged = await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: game.matchers[0].id } });
      expect(unchanged.revision).toBe(0n);
      expect(unchanged.iconHash).toBe("original-icon");
      expect(serverRequest.cdnUpload).not.toHaveBeenCalled();
   });

   test("keeps matcher rules and revisions unchanged if uploading an icon fails", async () => {
      spyOn(serverRequest, "cdnUpload").mockRejectedValue(new Error("CDN unavailable"));
      await expect(patchMatcher({ icon: png, exeNames: ["changed.exe"] })).rejects.toThrow();
      const unchanged = await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: game.matchers[0].id } });
      expect(unchanged.exeNames).toEqual(rules.exeNames);
      expect(unchanged.iconHash).toBe("original-icon");
      expect(unchanged.revision).toBe(0n);
   });

   test("cannot edit a matcher through a different game or edit a deleted matcher", async () => {
      await expect(patchMatcher({}, game.id + 1)).rejects.toThrow("Not Found");
      await prisma.applicationMatcher.update({ where: { id: game.matchers[0].id }, data: { deletedAt: new Date() } });
      await expect(patchMatcher()).rejects.toThrow("Not Found");
   });

   test("changes the IGDB reference and aliases while preserving game and matcher identities", async () => {
      const snapshot = await catalog();
      const result = (await testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", {
         igdbId: newIGDBId,
      })) as APIStaffKnownGame;
      expect(result).toMatchObject({ id: game.id, igdbId: newIGDBId, canonicalName: "Corrected game", aliases: ["Corrected alias", "Localized game"] });
      expect(result.matchers.map((matcher) => matcher.id)).toEqual(game.matchers.map((matcher) => matcher.id));
      const delta = await catalog(snapshot.cursor);
      expect(delta.games).toHaveLength(1);
      expect(delta.games[0].canonicalName).toBe("Corrected game");
      expect(delta.matchers).toEqual([]);
   });

   test("rejects an IGDB reference already linked to another game", async () => {
      const other = await prisma.knownGame.create({ data: { igdbId: newIGDBId, canonicalName: "Existing game", aliases: [], revision: 0n } });
      otherGameId = other.id;
      await expect(testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", { igdbId: newIGDBId })).rejects.toThrow(
         "already linked",
      );
      const unchanged = await prisma.knownGame.findUniqueOrThrow({ where: { id: game.id } });
      expect(unchanged.igdbId).toBe(game.igdbId);
      expect(unchanged.revision).toBe(0n);
   });

   test("rejects missing IGDB references and deleted games", async () => {
      spyOn(igdb, "getIGDBGame").mockResolvedValue(undefined);
      await expect(testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", { igdbId: newIGDBId })).rejects.toThrow(
         "Not Found",
      );
      await prisma.knownGame.update({ where: { id: game.id }, data: { deletedAt: new Date() } });
      await expect(patchMatcher()).rejects.toThrow("Not Found");
      await expect(testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", { igdbId: newIGDBId })).rejects.toThrow(
         "Not Found",
      );
   });

   test("notifies an unrelated connected client after matcher and IGDB edits", async () => {
      const [viewer] = await createTestUsers(1);
      const { ws } = await getReadyWebSocket(viewer);
      const updates: Promise<void>[] = [];
      function nextUpdate() {
         const promise = new Promise<void>((resolve) => {
            ws.onmessage = (event) => {
               if (testIsDispatch(JSON.parse(event.data), "application_catalog_update")) resolve();
            };
         });
         updates.push(promise);
         return promise;
      }
      const matcherUpdate = nextUpdate();
      await patchMatcher();
      await matcherUpdate;
      const gameUpdate = nextUpdate();
      await testHandler(`/api/staff/known-games/${game.id}`, authHeader(staff.accessToken), "PATCH", { igdbId: newIGDBId });
      await gameUpdate;
      expect(updates).toHaveLength(2);
   });
});
