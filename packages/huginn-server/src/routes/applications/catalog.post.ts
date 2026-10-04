import { invalidBody, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma, selectContribution } from "@huginn/backend-shared/database";
import { logger } from "@huginn/backend-shared/logger";
import { CDNRoutes, cleanApplicationTitle, Errors, getFileHash, toArrayBuffer, type APIPostApplicationCatalogResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { filterContribution } from "#utils/helpers";
import { cdnUpload } from "#utils/server-request";

const schema = t.Object({
   windowTitle: t.String({ minLength: 1, maxLength: 1_024 }),
   exePath: t.String({ minLength: 1, maxLength: 32_768 }),
   commandLine: t.Optional(t.String({ maxLength: 131_072 })),
   platform: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
   icon: t.Optional(t.String({ maxLength: 4_000_000 })),
});

export const postKnownApplication = new Elysia().use(verifyJwt()).post(
   "/api/applications/catalog",
   async ({ body, status, tokenPayload }) => {
      const cleanedWindowTitle = cleanApplicationTitle(body.windowTitle);
      if (!cleanedWindowTitle) return invalidBody(status);

      const existingContribution = await prisma.contribution.findFirst({
         where: {
            OR: [{ windowTitle: body.windowTitle }, { cleanedWindowTitle: cleanedWindowTitle }, { exePath: body.exePath }],
            contributorId: BigInt(tokenPayload.id),
         },
         select: { id: true },
      });

      if (existingContribution) {
         return singleError(Errors.duplicateContribution(), status);
      }

      let contribution = await prisma.contribution.create({
         data: {
            windowTitle: body.windowTitle,
            cleanedWindowTitle,
            exePath: body.exePath,
            commandLine: body.commandLine,
            platform: body.platform ?? "unknown",
            contributorId: BigInt(tokenPayload.id),
            status: "pending",
         },
         select: selectContribution,
      });

      if (body.icon) {
         try {
            const data = toArrayBuffer(body.icon);
            const iconHash = getFileHash(data);

            await cdnUpload(CDNRoutes.uploadApplicationIcon(contribution.id), {
               files: [{ data, name: iconHash }],
            });
            contribution = await prisma.contribution.update({
               where: { id: contribution.id },
               data: { iconHash },
               select: selectContribution,
            });
         } catch (error) {
            logger.warn({ error, contributionId: contribution.id }, "failed to store a contribution icon");
         }
      }

      const gatewayContribution = filterContribution(contribution);
      if (gatewayContribution) dispatchToTopic(tokenPayload.id, "application_contribution_add", gatewayContribution);

      const json: APIPostApplicationCatalogResult = { contributionId: contribution.id };
      return status("Accepted", json);
   },
   { body: schema },
);
