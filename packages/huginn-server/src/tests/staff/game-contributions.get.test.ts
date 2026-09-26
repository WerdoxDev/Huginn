import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { UserFlags, type APIGetStaffGameContributionsResult } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers } from "#tests/utils";

describe("GET /api/staff/game-contributions", () => {
   test("requires the live staff user flag", async () => {
      const [user] = await createTestUsers(1);
      const result = testHandler("/api/staff/game-contributions", authHeader(user.accessToken), "GET");
      expect(result).rejects.toThrow("Forbidden");
   });

   test("returns only pending contributions to staff", async () => {
      const [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      const created = await prisma.contribution.createManyAndReturn({
         data: [
            {
               windowTitle: "Pending Game",
               cleanedWindowTitle: "Pending Game",
               exePath: "/games/pending.exe",
               commandLine: "pending.exe --play",
               platform: "linux",
               contributorId: user.id,
               status: "pending",
            },
            {
               windowTitle: "Accepted Game",
               cleanedWindowTitle: "Accepted Game",
               exePath: "/games/accepted.exe",
               platform: "linux",
               contributorId: user.id,
               status: "accepted",
            },
         ],
      });

      try {
         const result = (await testHandler("/api/staff/game-contributions", authHeader(user.accessToken), "GET")) as APIGetStaffGameContributionsResult;
         expect(result.contributions.some((contribution) => contribution.id === created[0].id)).toBeTrue();
         expect(result.contributions.some((contribution) => contribution.id === created[1].id)).toBeFalse();
      } finally {
         await prisma.contribution.deleteMany({ where: { id: { in: created.map((contribution) => contribution.id) } } });
      }
   });
});
