import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { UserFlags, type APIContribution } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers, getReadyWebSocket, testIsDispatch } from "#tests/utils";

describe("POST /api/staff/game-contributions/:contributionId/reject", () => {
   test("requires the live staff user flag", async () => {
      const [user] = await createTestUsers(1);
      const result = testHandler("/api/staff/game-contributions/1/reject", authHeader(user.accessToken), "POST");
      await expect(result).rejects.toThrow("Forbidden");
   });

   test("marks a pending contribution as rejected", async () => {
      const [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      const { ws } = await getReadyWebSocket(user);
      const contribution = await prisma.contribution.create({
         data: {
            windowTitle: "Rejected Game",
            cleanedWindowTitle: "Rejected Game",
            exePath: "/games/rejected.exe",
            platform: "linux",
            contributorId: user.id,
         },
      });

      try {
         const contributionUpdated = new Promise<APIContribution>((resolve) => {
            ws.onmessage = (event) => {
               if (testIsDispatch(event.data, "application_contribution_update")) resolve(JSON.parse(event.data).d);
            };
         });
         const result = await testHandler(`/api/staff/game-contributions/${contribution.id}/reject`, authHeader(user.accessToken), "POST");
         expect(result).toBeUndefined();

         const gatewayContribution = await contributionUpdated;
         expect(gatewayContribution.id).toBe(contribution.id);
         expect(gatewayContribution.status).toBe("rejected");

         const updated = await prisma.contribution.findUniqueOrThrow({ where: { id: contribution.id } });
         expect(updated.status).toBe("rejected");
      } finally {
         await prisma.contribution.delete({ where: { id: contribution.id } });
      }
   });

   test("does not review a contribution twice", async () => {
      const [user] = await createTestUsers(1);
      await prisma.user.update({ where: { id: user.id }, data: { flags: UserFlags.STAFF } });
      const contribution = await prisma.contribution.create({
         data: {
            windowTitle: "Accepted Game",
            cleanedWindowTitle: "Accepted Game",
            exePath: "/games/accepted.exe",
            platform: "linux",
            contributorId: user.id,
            status: "accepted",
         },
      });

      try {
         const result = testHandler(`/api/staff/game-contributions/${contribution.id}/reject`, authHeader(user.accessToken), "POST");
         await expect(result).rejects.toThrow("This contribution has already been reviewed.");

         const unchanged = await prisma.contribution.findUniqueOrThrow({ where: { id: contribution.id } });
         expect(unchanged.status).toBe("accepted");
      } finally {
         await prisma.contribution.delete({ where: { id: contribution.id } });
      }
   });
});
