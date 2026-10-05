import { analytics, idFix, type Snowflake } from "@huginnjs/shared";

import { prisma, Prisma, selectContribution } from "#database";

export const contributionExtension = Prisma.defineExtension({
   model: {
      contribution: {
         async getUserContributions(userId: Snowflake) {
            return analytics.startActiveSpan("db.contribution.getUserContributions", async (span) => {
               span.setAttributes({
                  "query.user_id": userId.toString(),
               });

               const contributions = await prisma.contribution.findMany({
                  where: { contributorId: BigInt(userId) },
                  orderBy: { createdAt: "desc" },
                  select: selectContribution,
               });

               span.setAttribute("contributions.count", contributions.length);

               return idFix(contributions) as Array<Omit<(typeof contributions)[number], "contributorId"> & { contributorId: Snowflake }>;
            });
         },
      },
   },
});
