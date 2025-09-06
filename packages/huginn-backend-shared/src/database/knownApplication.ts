import { assertObj, prisma, Prisma } from "#database";
import { DBErrorType } from "#types";

export const knownApplicationsExtension = Prisma.defineExtension({
   model: {
      knownApplications: {
         async getAll<Args extends Prisma.KnownApplicationsDefaultArgs>(since?: Date, args?: Args) {
            const knownApplications = await prisma.knownApplications.findMany({
               where: since
                  ? { OR: [{ updatedAt: { gte: since } }, { createdAt: { gte: since } }, { deletedAt: { gte: since } }] }
                  : { deletedAt: null },
               ...args,
            });

            assertObj("getAll", knownApplications, DBErrorType.NULL_KNOWN_APPLICATION);
            return knownApplications as Prisma.KnownApplicationsGetPayload<Args>[];
         },
      },
   },
});
