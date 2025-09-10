import { assertObj, prisma, Prisma, type KnownApplicationArgs, type KnownApplicationPayload } from "#database";
import { DBErrorType } from "#types";

export const knownApplicationExtension = Prisma.defineExtension({
   model: {
      knownApplication: {
         async getAll<Args extends KnownApplicationArgs>(since?: Date, args?: Args) {
            const knownApplications = await prisma.knownApplication.findMany({
               where: since
                  ? { OR: [{ updatedAt: { gte: since } }, { createdAt: { gte: since } }, { deletedAt: { gte: since } }] }
                  : { deletedAt: null },
               ...args,
            });

            assertObj("getAll", knownApplications, DBErrorType.NULL_KNOWN_APPLICATION);
            return knownApplications as KnownApplicationPayload<Args>[];
         },
      },
   },
});
