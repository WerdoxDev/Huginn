import { notFound } from "@huginn/backend-shared";
import { prisma, selectContribution } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { filterContribution } from "#utils/helpers";
import { verifyStaff } from "#utils/staff";

const paramsSchema = t.Object({ contributionId: t.Numeric({ minimum: 1 }) });

export const postStaffRejectGameContribution = new Elysia().use(verifyStaff()).post(
   "/api/staff/game-contributions/:contributionId/reject",
   async ({ params: { contributionId }, status }) => {
      const result = await prisma.contribution.updateMany({
         where: { id: contributionId, status: "pending" },
         data: { status: "rejected" },
      });

      if (result.count === 1) {
         const contribution = await prisma.contribution.findUnique({ where: { id: contributionId }, select: selectContribution });
         const gatewayContribution = contribution && filterContribution(contribution);
         if (gatewayContribution) {
            dispatchToTopic(gatewayContribution.contributorId, "application_contribution_update", gatewayContribution);
         }
         return status("No Content");
      }

      const contribution = await prisma.contribution.findUnique({
         where: { id: contributionId },
         select: { id: true },
      });
      if (!contribution) return notFound(status);

      return status("Conflict", { message: "This contribution has already been reviewed." });
   },
   { params: paramsSchema },
);
