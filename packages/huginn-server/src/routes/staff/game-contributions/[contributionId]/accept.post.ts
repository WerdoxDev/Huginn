import type { APIPostAcceptGameContributionResult } from "@huginnjs/shared";

import { notFound } from "@huginn/backend-shared";
import { nextApplicationCatalogRevision, prisma, prismaBase, Prisma, selectApplicationMatcher, selectKnownGame } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { filterApplicationMatcher, filterKnownGame } from "#utils/helpers";
import { getIGDBGame } from "#utils/igdb";
import { verifyStaff } from "#utils/staff";

const paramsSchema = t.Object({ contributionId: t.Numeric({ minimum: 1 }) });
const bodySchema = t.Object({ igdbId: t.Number({ minimum: 1 }) });

export const postAcceptGameContribution = new Elysia().use(verifyStaff()).post(
   "/api/staff/game-contributions/:contributionId/accept",
   async ({ params: { contributionId }, body, status }) => {
      const pendingContribution = await prisma.contribution.findUnique({
         where: { id: contributionId },
         select: { id: true, status: true },
      });
      if (!pendingContribution) return notFound(status);
      if (pendingContribution.status !== "pending") {
         return status("Conflict", { message: "This contribution has already been reviewed." });
      }

      const selectedGame = await getIGDBGame(body.igdbId);
      if (!selectedGame) return notFound(status);

      const canonicalName = selectedGame.name;
      const aliases = [
         ...(selectedGame.alternative_names ?? []).map((alternative) => alternative.name),
         ...(selectedGame.game_localizations ?? []).map((localization) => localization.name),
      ].filter((name, index, names) => name !== canonicalName && names.indexOf(name) === index);

      const result = await prismaBase.$transaction(
         async (transaction) => {
            const contribution = await transaction.contribution.findUnique({ where: { id: contributionId } });
            if (!contribution || contribution.status !== "pending") return null;

            const exeName = contribution.exePath.split(/[/\\]+/).pop();
            if (!exeName) return null;

            const revision = await nextApplicationCatalogRevision(transaction);
            const existingGame = await transaction.knownGame.findUnique({ where: { igdbId: selectedGame.id } });
            const game = existingGame
               ? await transaction.knownGame.update({
                    where: { id: existingGame.id },
                    data: { canonicalName, aliases, revision, deletedAt: null },
                    select: selectKnownGame,
                 })
               : await transaction.knownGame.create({
                    data: { igdbId: selectedGame.id, canonicalName, aliases, revision },
                    select: selectKnownGame,
                 });

            const existingMatcher = await transaction.applicationMatcher.findFirst({
               where: {
                  knownGameId: game.id,
                  exeNames: { has: exeName },
                  platform: contribution.platform,
               },
            });
            const matcher = existingMatcher
               ? await transaction.applicationMatcher.update({
                    where: { id: existingMatcher.id },
                    data: {
                       exeNames: [...new Set([...existingMatcher.exeNames, exeName])],
                       windowTitles: [...new Set([...existingMatcher.windowTitles, contribution.cleanedWindowTitle])],
                       status: "verified",
                       verificationMethod: "manual",
                       revision,
                       deletedAt: null,
                    },
                    select: selectApplicationMatcher,
                 })
               : await transaction.applicationMatcher.create({
                    data: {
                       knownGameId: game.id,
                       exeNames: [exeName],
                       windowTitles: [contribution.cleanedWindowTitle],
                       platform: contribution.platform,
                       status: "verified",
                       verificationMethod: "manual",
                       contributorId: contribution.contributorId,
                       commandLinePatterns: [],
                       revision,
                    },
                    select: selectApplicationMatcher,
                 });

            await transaction.contribution.update({
               where: { id: contribution.id },
               data: {
                  status: "accepted",
                  knownGameId: game.id,
                  applicationMatcherId: matcher.id,
               },
            });

            return { game, matcher };
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (!result) return status("Conflict", { message: "This contribution has already been reviewed." });

      const json: APIPostAcceptGameContributionResult = {
         game: filterKnownGame(result.game),
         matcher: filterApplicationMatcher(result.matcher),
      };
      return status("OK", json);
   },
   { params: paramsSchema, body: bodySchema },
);
