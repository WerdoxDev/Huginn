import { analytics, idFix, recordSpanError, type Snowflake } from "@huginnjs/shared";

import { assertExists, assertId, assertObj, prisma, Prisma, type KnownApplicationArgs, type KnownApplicationPayload } from "#database";
import { DBErrorType } from "#types";

export const knownApplicationExtension = Prisma.defineExtension({
   model: {
      knownApplication: {
         async getAll<Args extends KnownApplicationArgs>(since?: Date, args?: Args) {
            return analytics.startActiveSpan("db.knownApplication.getAll", async (span) => {
               span.setAttribute("query.has_since", !!since);
               try {
                  const knownApplications = await prisma.knownApplication.findMany({
                     where: since
                        ? {
                             OR: [{ updatedAt: { gte: since } }, { createdAt: { gte: since } }, { deletedAt: { gte: since } }],
                             active: true,
                          }
                        : { deletedAt: null, active: true },
                     ...args,
                  });

                  span.setAttribute("known_applications.count", knownApplications.length);

                  return idFix(knownApplications) as KnownApplicationPayload<Args>[];
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
         async createOne<Args extends KnownApplicationArgs>(
            options: {
               names: string[];
               exeName: string;
               contributorId?: Snowflake;
               igdbId?: number;
               isActive: boolean;
            },
            args?: Args,
         ) {
            return analytics.startActiveSpan("db.knownApplication.createOne", async (span) => {
               span.setAttributes({
                  "query.names.count": options.names.length,
                  "query.has_contributor": !!options.contributorId,
                  "query.has_igdb_id": options.igdbId !== undefined,
                  "query.is_active": options.isActive,
               });

               const methodName = "knownApplication.createOne";
               try {
                  assertId(methodName, options.contributorId);
                  const knownApplication = await prisma.knownApplication.create({
                     data: {
                        names: options.names,
                        exeName: options.exeName,
                        contributorId: options.contributorId ? BigInt(options.contributorId) : undefined,
                        createdAt: new Date(),
                        igdbId: options.igdbId,
                        active: options.isActive,
                     },
                     ...args,
                  });

                  span.setAttribute("known_application.id", knownApplication.id.toString());

                  assertObj(methodName, knownApplication, DBErrorType.NULL_KNOWN_APPLICATION);
                  return idFix(knownApplication) as KnownApplicationPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  assertExists(e, methodName, DBErrorType.NULL_USER, [options.contributorId!]);
                  throw e;
               }
            });
         },
      },
   },
});
