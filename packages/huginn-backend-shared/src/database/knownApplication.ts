import { assertExists, assertId, assertObj, prisma, Prisma, type KnownApplicationArgs, type KnownApplicationPayload } from "#database";
import { DBErrorType } from "#types";
import { idFix, type Snowflake } from "@huginn/shared";

export const knownApplicationExtension = Prisma.defineExtension({
   model: {
      knownApplication: {
         async getAll<Args extends KnownApplicationArgs>(since?: Date, args?: Args) {
            const methodName = "knownApplication.getAll";
            const knownApplications = await prisma.knownApplication.findMany({
               where: since
                  ? { OR: [{ updatedAt: { gte: since } }, { createdAt: { gte: since } }, { deletedAt: { gte: since } }] }
                  : { deletedAt: null },
               ...args,
            });

            assertObj(methodName, knownApplications, DBErrorType.NULL_KNOWN_APPLICATION);
            return idFix(knownApplications) as KnownApplicationPayload<Args>[];
         },
         async createOne<Args extends KnownApplicationArgs>(
            options: { name: string; exeName: string; contributorId?: Snowflake; igdbId?: number },
            args?: Args,
         ) {
            const methodName = "knownApplication.createOne";
            try {
               assertId(methodName, options.contributorId);
               const knownApplication = await prisma.knownApplication.create({
                  data: {
                     name: options.name,
                     exeName: options.exeName,
                     contributorId: options.contributorId ? BigInt(options.contributorId) : undefined,
                     createdAt: new Date(),
                     igdbId: options.igdbId,
                  },
                  ...args,
               });

               assertObj(methodName, knownApplication, DBErrorType.NULL_KNOWN_APPLICATION);
               return idFix(knownApplication) as KnownApplicationPayload<Args>;
            } catch (e) {
               assertExists(e, methodName, DBErrorType.NULL_KNOWN_APPLICATION, [options.contributorId]);
               throw e;
            }
         },
      },
   },
});
