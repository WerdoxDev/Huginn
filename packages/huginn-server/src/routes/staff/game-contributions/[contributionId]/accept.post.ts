import { notFound } from "@huginn/backend-shared";
import {
   nextApplicationCatalogRevision,
   prisma,
   prismaBase,
   Prisma,
   selectApplicationMatcher,
   selectContribution,
   selectKnownGame,
} from "@huginn/backend-shared/database";
import { CDNRoutes, type APIPostAcceptGameContributionResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { isValidExeName, matcherValuesSchema, normalizeExeNames, normalizeMatcherValues } from "#utils/application-matchers";
import { dispatchToTopic } from "#utils/gateway-utils";
import { filterApplicationMatcher, filterContribution, filterKnownGame } from "#utils/helpers";
import { getIGDBGame } from "#utils/igdb";
import { cdnFetch, cdnUpload } from "#utils/server-request";
import { verifyStaff } from "#utils/staff";

const paramsSchema = t.Object({ contributionId: t.Numeric({ minimum: 1 }) });
const bodySchema = t.Object({
   igdbId: t.Number({ minimum: 1 }),
   exeNames: matcherValuesSchema,
   windowTitles: matcherValuesSchema,
   commandLinePatterns: matcherValuesSchema,
});

function sameMatcherValues(left: string[], right: string[]) {
   const values = new Set(left);
   return values.size === new Set(right).size && right.every((value) => values.has(value));
}

export const postStaffAcceptGameContribution = new Elysia().use(verifyStaff()).post(
   "/api/staff/game-contributions/:contributionId/accept",
   async ({ params: { contributionId }, body, status }) => {
      const exeNames = normalizeExeNames(body.exeNames);
      const windowTitles = normalizeMatcherValues(body.windowTitles);
      const commandLinePatterns = normalizeMatcherValues(body.commandLinePatterns);
      if (exeNames.some((exeName) => !isValidExeName(exeName))) {
         return status("Bad Request", { message: "Executable names may include at most one parent folder." });
      }
      if (exeNames.length === 0 && windowTitles.length === 0) {
         return status("Bad Request", { message: "At least one executable name or window title is required." });
      }

      const pendingContribution = await prisma.contribution.findUnique({
         where: { id: contributionId },
         select: { id: true, status: true, iconHash: true },
      });
      if (!pendingContribution) return notFound(status);
      if (pendingContribution.status !== "pending") {
         return status("Conflict", { message: "This contribution has already been reviewed." });
      }

      const selectedGame = await getIGDBGame(body.igdbId);
      if (!selectedGame) return notFound(status);

      const contributionIcon = pendingContribution.iconHash
         ? await cdnFetch(CDNRoutes.applicationIcon(pendingContribution.id, pendingContribution.iconHash))
         : undefined;

      const canonicalName = selectedGame.name;
      const aliases = [
         ...(selectedGame.alternative_names ?? []).map((alternative) => alternative.name),
         ...(selectedGame.game_localizations ?? []).map((localization) => localization.name),
      ]
         .filter((name, index, names) => name !== canonicalName && names.indexOf(name) === index)
         .filter(Boolean);

      const result = await prismaBase.$transaction(
         async (tx) => {
            const contribution = await tx.contribution.findUnique({ where: { id: contributionId } });
            if (!contribution || contribution.status !== "pending") return null;

            const revision = await nextApplicationCatalogRevision(tx);
            const existingGame = await tx.knownGame.findUnique({ where: { igdbId: selectedGame.id } });
            const game = existingGame
               ? await tx.knownGame.update({
                    where: { id: existingGame.id },
                    data: { canonicalName, aliases, revision, deletedAt: null },
                    select: selectKnownGame,
                 })
               : await tx.knownGame.create({
                    data: { igdbId: selectedGame.id, canonicalName, aliases, revision },
                    select: selectKnownGame,
                 });

            if (contribution.iconHash && contributionIcon) {
               await cdnUpload(CDNRoutes.uploadApplicationIcon(game.id), {
                  files: [{ data: contributionIcon, name: contribution.iconHash }],
               });
            }

            const candidates = await tx.applicationMatcher.findMany({
               where: { knownGameId: game.id, platform: contribution.platform, deletedAt: null },
               orderBy: { id: "asc" },
            });
            // Overlapping rules can describe different regional versions. Only reuse
            // equivalent rules with compatible icons; never combine their constraints.
            const existingMatcher = candidates.find(
               (candidate) =>
                  sameMatcherValues(normalizeExeNames(candidate.exeNames), exeNames) &&
                  sameMatcherValues(candidate.windowTitles, windowTitles) &&
                  sameMatcherValues(candidate.commandLinePatterns, commandLinePatterns) &&
                  (!candidate.iconHash || !contribution.iconHash || candidate.iconHash === contribution.iconHash),
            );
            const matcher = existingMatcher
               ? await tx.applicationMatcher.update({
                    where: { id: existingMatcher.id },
                    data: {
                       exeNames,
                       windowTitles,
                       commandLinePatterns,
                       iconHash: contribution.iconHash ?? existingMatcher.iconHash,
                       status: "verified",
                       verificationMethod: "manual",
                       revision,
                       deletedAt: null,
                    },
                    select: selectApplicationMatcher,
                 })
               : await tx.applicationMatcher.create({
                    data: {
                       knownGameId: game.id,
                       iconHash: contribution.iconHash,
                       exeNames,
                       windowTitles,
                       commandLinePatterns,
                       platform: contribution.platform,
                       status: "verified",
                       verificationMethod: "manual",
                       contributorId: contribution.contributorId,
                       revision,
                    },
                    select: selectApplicationMatcher,
                 });

            const updatedContribution = await tx.contribution.update({
               where: { id: contribution.id },
               data: {
                  status: "accepted",
                  knownGameId: game.id,
                  applicationMatcherId: matcher.id,
               },
               select: selectContribution,
            });

            return { contribution: updatedContribution, game, matcher };
         },
         { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (!result) return status("Conflict", { message: "This contribution has already been reviewed." });

      dispatchToTopic("application_catalog", "application_catalog_update", undefined);

      const gatewayContribution = filterContribution(result.contribution);
      if (gatewayContribution) {
         dispatchToTopic(gatewayContribution.contributorId, "application_contribution_update", gatewayContribution);
      }

      const json: APIPostAcceptGameContributionResult = {
         game: filterKnownGame(result.game),
         matcher: filterApplicationMatcher(result.matcher),
      };
      return status("OK", json);
   },
   { params: paramsSchema, body: bodySchema },
);
