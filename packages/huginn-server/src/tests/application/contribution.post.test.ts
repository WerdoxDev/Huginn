import type { APIContribution, APIGetUserContributionsResult, APIPostApplicationCatalogResult } from "@huginnjs/shared";

import { testHandler } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { describe, expect, test } from "bun:test";

import { authHeader, createTestUsers, getReadyWebSocket, testIsDispatch } from "#tests/utils";

describe("POST /api/applications/catalog", () => {
   test("queues every submission as a separate pending contribution", async () => {
      const [user] = await createTestUsers(1);
      const { ws } = await getReadyWebSocket(user);
      const body = {
         windowTitle: "Test Game™",
         exePath: "/games/test-game/game.exe",
         commandLine: "game.exe --test",
         platform: "windows",
      };

      const contributionAdded = new Promise<APIContribution>((resolve) => {
         ws.onmessage = (event) => {
            if (testIsDispatch(event.data, "application_contribution_add")) resolve(JSON.parse(event.data).d);
         };
      });

      const first = (await testHandler("/api/applications/catalog", authHeader(user.accessToken), "POST", body)) as APIPostApplicationCatalogResult;
      const firstGatewayContribution = await contributionAdded;
      const second = (await testHandler("/api/applications/catalog", authHeader(user.accessToken), "POST", body)) as APIPostApplicationCatalogResult;

      try {
         expect(first.contributionId).not.toBe(second.contributionId);
         expect(firstGatewayContribution.id).toBe(first.contributionId);
         expect(firstGatewayContribution.status).toBe("pending");
         expect(firstGatewayContribution.contributorId).toBe(user.id.toString());
         const contributions = await prisma.contribution.findMany({
            where: { id: { in: [first.contributionId, second.contributionId] } },
            orderBy: { id: "asc" },
         });
         expect(contributions).toHaveLength(2);
         expect(contributions.every((contribution) => contribution.status === "pending")).toBeTrue();
         expect(contributions.every((contribution) => contribution.cleanedWindowTitle === "Test Game")).toBeTrue();

         const userContributions = (await testHandler(
            "/api/applications/contributions/@me",
            authHeader(user.accessToken),
            "GET",
         )) as APIGetUserContributionsResult;
         expect(userContributions.filter((contribution) => [first.contributionId, second.contributionId].includes(contribution.id))).toHaveLength(2);
      } finally {
         await prisma.contribution.deleteMany({ where: { id: { in: [first.contributionId, second.contributionId] } } });
      }
   });
});
