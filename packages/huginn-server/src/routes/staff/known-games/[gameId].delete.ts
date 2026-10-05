import { notFound } from "@huginn/backend-shared";
import { nextApplicationCatalogRevision, Prisma, prismaBase } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { verifyStaff } from "#utils/staff";

const paramsSchema = t.Object({ gameId: t.Numeric({ minimum: 1 }) });

export const deleteStaffKnownGame = new Elysia().use(verifyStaff()).delete(
   "/api/staff/known-games/:gameId",
   async ({ params: { gameId }, status }) => {
      const deleted = await prismaBase.$transaction(
         async (tx) => {
            const game = await tx.knownGame.findFirst({
               where: { id: gameId, deletedAt: null },
               select: { id: true },
            });
            if (!game) return false;

            const revision = await nextApplicationCatalogRevision(tx);
            const deletedAt = new Date();
            await tx.applicationMatcher.updateMany({
               where: { knownGameId: game.id, deletedAt: null },
               data: { deletedAt, revision },
            });
            await tx.knownGame.update({
               where: { id: game.id },
               data: { deletedAt, revision },
            });
            await tx.contribution.deleteMany({ where: { knownGameId: game.id } });
            return true;
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (!deleted) return notFound(status);
      return status("No Content");
   },
   { params: paramsSchema },
);
