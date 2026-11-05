import type { APIPatchStaffKnownGameResult } from "@huginnjs/shared";

import { notFound } from "@huginn/backend-shared";
import { nextApplicationCatalogRevision, Prisma, prisma, prismaBase, selectApplicationMatcher, selectKnownGame } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { filterApplicationMatcher, filterKnownGame } from "#utils/helpers";
import { getIGDBGame } from "#utils/igdb";
import { verifyStaff } from "#utils/staff";

export const patchStaffKnownGame = new Elysia().use(verifyStaff()).patch(
   "/api/staff/known-games/:gameId",
   async ({ params: { gameId }, body, status }) => {
      const current = await prisma.knownGame.findFirst({ where: { id: gameId, deletedAt: null }, select: { id: true } });
      if (!current) return notFound(status);

      const selectedGame = await getIGDBGame(body.igdbId);
      if (!selectedGame) return notFound(status);

      const aliases = [
         ...new Set([
            ...(selectedGame.alternative_names ?? []).map((alternative) => alternative.name),
            ...(selectedGame.game_localizations ?? []).map((localization) => localization.name),
         ]),
      ].filter((name) => name && name !== selectedGame.name);

      const result = await prismaBase.$transaction(
         async (tx) => {
            const game = await tx.knownGame.findFirst({ where: { id: gameId, deletedAt: null }, select: { id: true } });
            if (!game) return { kind: "missing" } as const;
            const existing = await tx.knownGame.findUnique({ where: { igdbId: selectedGame.id }, select: { id: true } });
            if (existing && existing.id !== gameId) return { kind: "conflict" } as const;

            const revision = await nextApplicationCatalogRevision(tx);
            const updated = await tx.knownGame.update({
               where: { id: gameId },
               data: { igdbId: selectedGame.id, canonicalName: selectedGame.name, aliases, revision },
               select: {
                  ...selectKnownGame,
                  applicationMatchers: { where: { deletedAt: null }, orderBy: { id: "asc" }, select: selectApplicationMatcher },
               },
            });
            return { kind: "updated", game: updated } as const;
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (result.kind === "missing") return notFound(status);
      if (result.kind === "conflict") return status("Conflict", { message: "That IGDB game is already linked to another known game." });

      dispatchToTopic("application_catalog", "application_catalog_update", undefined);
      const json: APIPatchStaffKnownGameResult = {
         ...filterKnownGame(result.game),
         matchers: result.game.applicationMatchers.map(filterApplicationMatcher),
      };
      return status("OK", json);
   },
   { params: t.Object({ gameId: t.Numeric({ minimum: 1 }) }), body: t.Object({ igdbId: t.Integer({ minimum: 1, maximum: 2_147_483_647 }) }) },
);
