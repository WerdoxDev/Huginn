import type { APIGetStaffKnownGamesResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { UserFlags } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";

function randomIGDBId() {
   return 1_000_000_000 + Math.floor(Math.random() * 1_000_000_000);
}

describe("staff known games", () => {
   test("requires the live staff user flag", async () => {
      const [user] = await createTestUsers(1);
      const getResult = testHandler("/api/staff/known-games", authHeader(user.accessToken), "GET");
      const deleteResult = testHandler("/api/staff/known-games/1", authHeader(user.accessToken), "DELETE");
      await expect(getResult).rejects.toThrow("Forbidden");
      await expect(deleteResult).rejects.toThrow("Forbidden");
   });

   test("lists active games with their active matchers", async () => {
      const [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      const game = await prisma.knownGame.create({
         data: {
            igdbId: randomIGDBId(),
            canonicalName: "Known Game Test",
            aliases: ["Known Game Alias"],
            revision: 0n,
         },
      });
      const matchers = await prisma.applicationMatcher.createManyAndReturn({
         data: [
            {
               knownGameId: game.id,
               exeNames: ["known-game.exe"],
               windowTitles: [],
               platform: "windows",
               status: "verified",
               verificationMethod: "manual",
               commandLinePatterns: [],
               revision: 0n,
            },
            {
               knownGameId: game.id,
               exeNames: ["deleted.exe"],
               windowTitles: [],
               platform: "windows",
               status: "verified",
               verificationMethod: "manual",
               commandLinePatterns: [],
               revision: 0n,
               deletedAt: new Date(),
            },
         ],
      });

      try {
         const result = (await testHandler("/api/staff/known-games", authHeader(user.accessToken), "GET")) as APIGetStaffKnownGamesResult;
         const listedGame = result.games.find((candidate) => candidate.id === game.id);
         expect(listedGame?.canonicalName).toBe("Known Game Test");
         expect(listedGame?.aliases).toEqual(["Known Game Alias"]);
         expect(listedGame?.matchers.map((matcher) => matcher.id)).toEqual([matchers[0].id]);
      } finally {
         await prisma.applicationMatcher.deleteMany({ where: { knownGameId: game.id } });
         await prisma.knownGame.delete({ where: { id: game.id } });
      }
   });

   test("soft deletes a game and all active matchers at one catalog revision", async () => {
      const [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      const game = await prisma.knownGame.create({
         data: {
            igdbId: randomIGDBId(),
            canonicalName: "Delete Game Test",
            aliases: [],
            revision: 0n,
            applicationMatchers: {
               create: {
                  exeNames: ["delete-game.exe"],
                  windowTitles: [],
                  platform: "linux",
                  status: "verified",
                  verificationMethod: "manual",
                  commandLinePatterns: [],
                  revision: 0n,
               },
            },
         },
         include: { applicationMatchers: true },
      });

      try {
         const result = await testHandler(`/api/staff/known-games/${game.id}`, authHeader(user.accessToken), "DELETE");
         expect(result).toBeUndefined();

         const deletedGame = await prisma.knownGame.findUniqueOrThrow({ where: { id: game.id } });
         const deletedMatcher = await prisma.applicationMatcher.findUniqueOrThrow({ where: { id: game.applicationMatchers[0].id } });
         expect(deletedGame.deletedAt).toBeInstanceOf(Date);
         expect(deletedMatcher.deletedAt).toBeInstanceOf(Date);
         expect(deletedMatcher.revision).toBe(deletedGame.revision);

         const listed = (await testHandler("/api/staff/known-games", authHeader(user.accessToken), "GET")) as APIGetStaffKnownGamesResult;
         expect(listed.games.some((candidate) => candidate.id === game.id)).toBeFalse();
      } finally {
         await prisma.applicationMatcher.deleteMany({ where: { knownGameId: game.id } });
         await prisma.knownGame.delete({ where: { id: game.id } });
      }
   });
});
