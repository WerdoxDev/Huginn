import { WorkerID, analytics, recordSpanError, snowflake } from "@huginn/shared";

import { Prisma, prisma } from "#database";

export const attachmentExtension = Prisma.defineExtension({
   model: {
      attachment: {
         async createOne(
            filename: string,
            contentType: string,
            size: number,
            url: string,
            flags: number,
            width?: number,
            height?: number,
            description?: string,
         ) {
            return analytics.startActiveSpan("db.attachment.createOne", async (span) => {
               span.setAttributes({
                  "query.size": size,
                  "query.flags": flags,
                  "query.has_dimensions": width !== undefined && height !== undefined,
                  "query.has_description": !!description,
                  "query.content_type": contentType,
               });

               try {
                  const attachment = await prisma.attachment.create({
                     data: {
                        id: snowflake.generate(WorkerID.ATTACHMENT),
                        filename,
                        description,
                        contentType,
                        size,
                        url,
                        width,
                        height,
                        flags,
                     },
                  });

                  span.setAttribute("attachment.id", attachment.id.toString());

                  return attachment;
               } catch (e) {
                  recordSpanError(e);
                  throw e;
               }
            });
         },
      },
   },
});
