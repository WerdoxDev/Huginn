import { verifyJwt } from "@huginn/backend-shared";
import { selectKnownApplication } from "@huginn/backend-shared/database/common";
import { prisma } from "@huginn/backend-shared/database/index";
import { type APIGetKnownApplicationsResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { filterKnownApplication } from "#utils/helpers";

const querySchema = t.Object({ since: t.Optional(t.Number()) });

export const getKnownApplications = new Elysia()
   .use(verifyJwt())
   .get("/api/applications/known", { query: querySchema }, async ({ status, query: { since } }) => {
      const sinceDate = since ? new Date(since) : undefined;
      const knownApplications = await prisma.knownApplication.getAll(sinceDate, {
         select: selectKnownApplication,
      });

      const json: APIGetKnownApplicationsResult = {
         lastUpdated: new Date().toISOString(),
         applications: knownApplications.map((x) => filterKnownApplication(x)),
      };

      return status("OK", json);
   });
