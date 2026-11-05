import { notFound } from "@huginn/backend-shared";
import { nextApplicationCatalogRevision, Prisma, prisma, prismaBase, selectApplicationMatcher } from "@huginn/backend-shared/database";
import { CDNRoutes, getFileHash, toArrayBuffer, type APIPatchStaffApplicationMatcherResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";
import { fileTypeFromBuffer } from "file-type";

import { isValidExeName, matcherValuesSchema, normalizeExeNames, normalizeMatcherValues } from "#utils/application-matchers";
import { dispatchToTopic } from "#utils/gateway-utils";
import { filterApplicationMatcher } from "#utils/helpers";
import { cdnUpload } from "#utils/server-request";
import { verifyStaff } from "#utils/staff";

export const patchStaffApplicationMatcher = new Elysia().use(verifyStaff()).patch(
   "/api/staff/known-games/:gameId/matchers/:matcherId",
   async ({ params: { gameId, matcherId }, body, status }) => {
      const exeNames = normalizeExeNames(body.exeNames);
      const windowTitles = normalizeMatcherValues(body.windowTitles);
      const commandLinePatterns = normalizeMatcherValues(body.commandLinePatterns);
      const platform = body.platform.trim();
      if (!platform) return status("Bad Request", { message: "A platform is required." });
      if (exeNames.some((value) => !isValidExeName(value))) {
         return status("Bad Request", { message: "Executable names may include at most one parent folder." });
      }
      if (!exeNames.length && !windowTitles.length) {
         return status("Bad Request", { message: "At least one executable name or window title is required." });
      }

      const where = { id: matcherId, knownGameId: gameId, deletedAt: null, knownGame: { deletedAt: null } };
      const current = await prisma.applicationMatcher.findFirst({ where, select: { id: true } });
      if (!current) return notFound(status);

      let iconHash: string | undefined;
      if (body.icon !== undefined) {
         let data: ArrayBuffer;
         try {
            data = toArrayBuffer(body.icon);
            const type = await fileTypeFromBuffer(data);
            if (!type || !["image/png", "image/jpeg", "image/webp"].includes(type.mime)) {
               return status("Bad Request", { message: "Choose a PNG, JPEG, or WebP icon." });
            }
         } catch {
            return status("Bad Request", { message: "The icon could not be read. Choose a PNG, JPEG, or WebP image." });
         }
         iconHash = getFileHash(data);
         await cdnUpload(CDNRoutes.uploadApplicationIcon(gameId), { files: [{ data, name: iconHash }] });
      }

      const matcher = await prismaBase.$transaction(
         async (tx) => {
            const active = await tx.applicationMatcher.findFirst({ where, select: { id: true } });
            if (!active) return null;
            const revision = await nextApplicationCatalogRevision(tx);
            return tx.applicationMatcher.update({
               where: { id: matcherId },
               data: { exeNames, windowTitles, commandLinePatterns, platform, iconHash, revision, status: "verified", verificationMethod: "manual" },
               select: selectApplicationMatcher,
            });
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      if (!matcher) return notFound(status);

      dispatchToTopic("application_catalog", "application_catalog_update", undefined);
      const json: APIPatchStaffApplicationMatcherResult = filterApplicationMatcher(matcher);
      return status("OK", json);
   },
   {
      params: t.Object({ gameId: t.Numeric({ minimum: 1 }), matcherId: t.Numeric({ minimum: 1 }) }),
      body: t.Object({
         exeNames: matcherValuesSchema,
         windowTitles: matcherValuesSchema,
         commandLinePatterns: matcherValuesSchema,
         platform: t.String({ minLength: 1, maxLength: 64 }),
         icon: t.Optional(t.String({ minLength: 1, maxLength: 4_000_000 })),
      }),
   },
);
