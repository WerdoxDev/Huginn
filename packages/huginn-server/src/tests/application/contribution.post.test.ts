import type { APIPostKnownApplicationResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";

describe("POST /api/applications/known", () => {
   test("queues every submission as a separate pending contribution", async () => {
      const [user] = await createTestUsers(1);
      const body = {
         windowTitle: "Test Game™",
         exePath: "/games/test-game/game.exe",
         commandLine: "game.exe --test",
         platform: "windows",
      };

      const first = (await testHandler("/api/applications/known", authHeader(user.accessToken), "POST", body)) as APIPostKnownApplicationResult;
      const second = (await testHandler("/api/applications/known", authHeader(user.accessToken), "POST", body)) as APIPostKnownApplicationResult;

      try {
         expect(first.contributionId).not.toBe(second.contributionId);
         const contributions = await prisma.contribution.findMany({
            where: { id: { in: [first.contributionId, second.contributionId] } },
            orderBy: { id: "asc" },
         });
         expect(contributions).toHaveLength(2);
         expect(contributions.every((contribution) => contribution.status === "pending")).toBeTrue();
         expect(contributions.every((contribution) => contribution.cleanedWindowTitle === "Test Game")).toBeTrue();
      } finally {
         await prisma.contribution.deleteMany({ where: { id: { in: [first.contributionId, second.contributionId] } } });
      }
   });
});
