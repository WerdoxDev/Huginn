import type { APIGetStaffGameContributionsResult, APIStaffGameContribution } from "@huginnjs/shared";

import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { env } from "#setup";
import { verifyStaff } from "#utils/staff";

export const getStaffGameContributions = new Elysia().use(verifyStaff()).get("/api/staff/game-contributions", async ({ status }) => {
   const contributions = await prisma.contribution.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      include: {
         contributor: {
            select: { id: true, username: true, displayName: true, avatar: true },
         },
      },
   });
   const cdnRoot = env.CDN_PUBLIC_URL?.replace(/\/$/, "") ?? "";

   const json: APIGetStaffGameContributionsResult = {
      contributions: contributions.map((contribution): APIStaffGameContribution => ({
         id: contribution.id,
         windowTitle: contribution.windowTitle,
         cleanedWindowTitle: contribution.cleanedWindowTitle,
         exePath: contribution.exePath,
         exeName: contribution.exePath.split(/[/\\]+/).pop() ?? contribution.exePath,
         commandLine: contribution.commandLine,
         platform: contribution.platform,
         iconUrl: contribution.iconHash ? `${cdnRoot}/application-icons/${contribution.id}/${contribution.iconHash}.webp` : null,
         contributor: contribution.contributor
            ? {
                 ...contribution.contributor,
                 id: contribution.contributor.id.toString(),
              }
            : null,
         createdAt: contribution.createdAt,
      })),
   };

   return status("OK", json);
});
