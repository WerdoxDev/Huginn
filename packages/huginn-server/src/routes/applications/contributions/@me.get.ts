import type { APIGetUserContributionsResult } from "@huginnjs/shared";

import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { Elysia } from "elysia";

export const getMeContribution = new Elysia().use(verifyJwt()).get("/api/applications/contributions/@me", async ({ status, tokenPayload }) => {
   const contributions = await prisma.contribution.getUserContributions(tokenPayload.id);
   const json: APIGetUserContributionsResult = contributions;

   return status("OK", json);
});
