import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { logger } from "@huginn/backend-shared/logger";
import { CDNRoutes, cleanApplicationTitle, getFileHash, toArrayBuffer, type APIPostKnownApplicationResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { cdnUpload } from "#utils/server-request";

const schema = t.Object({
   windowTitle: t.String({ minLength: 1, maxLength: 1_024 }),
   exePath: t.String({ minLength: 1, maxLength: 32_768 }),
   commandLine: t.Optional(t.String({ maxLength: 131_072 })),
   platform: t.Optional(t.String({ minLength: 1, maxLength: 64 })),
   icon: t.Optional(t.String({ maxLength: 4_000_000 })),
});

export const postKnownApplication = new Elysia().use(verifyJwt()).post(
   "/api/applications/known",
   async ({ body, status, tokenPayload }) => {
      const cleanedWindowTitle = cleanApplicationTitle(body.windowTitle);
      if (!cleanedWindowTitle) return invalidBody(status);

      const contribution = await prisma.contribution.create({
         data: {
            windowTitle: body.windowTitle,
            cleanedWindowTitle,
            exePath: body.exePath,
            commandLine: body.commandLine,
            platform: body.platform ?? "unknown",
            contributorId: BigInt(tokenPayload.id),
            status: "pending",
         },
         select: { id: true },
      });

      if (body.icon) {
         try {
            const data = toArrayBuffer(body.icon);
            const iconHash = getFileHash(data);

            await cdnUpload(CDNRoutes.uploadApplicationIcon(contribution.id), {
               files: [{ data, name: iconHash }],
            });
            await prisma.contribution.update({
               where: { id: contribution.id },
               data: { iconHash },
            });
         } catch (error) {
            logger.warn({ error, contributionId: contribution.id }, "failed to store a contribution icon");
         }
      }

      const json: APIPostKnownApplicationResult = { contributionId: contribution.id };
      return status("Accepted", json);
   },
   { body: schema },
);
