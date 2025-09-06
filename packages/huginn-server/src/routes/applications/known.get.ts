import { createRoute, validator, verifyJwt } from "@huginn/backend-shared";
import { selectKnownApplication } from "@huginn/backend-shared/database/common";
import { prisma } from "@huginn/backend-shared/database/index";
import { HttpCode, type APIGetKnownApplicationsResult } from "@huginn/shared";
import z from "zod";

const querySchema = z.object({ since: z.optional(z.string()) });

createRoute("GET", "/api/applications/known", verifyJwt(), validator("query", querySchema), async (c) => {
   const { since } = c.req.valid("query");

   const sinceDate = since ? new Date(Number(since)) : undefined;
   console.log(sinceDate);
   const knownApplications = await prisma.knownApplications.getAll(sinceDate, { select: selectKnownApplication });

   const json: APIGetKnownApplicationsResult = { lastUpdated: new Date().toISOString(), applications: knownApplications };
   return c.json(json, HttpCode.OK);
});
