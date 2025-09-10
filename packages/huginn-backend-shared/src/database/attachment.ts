import { WorkerID, idFix, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { prisma, type AttachmentArgs, type AttachmentPayload } from "#database";

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

            return attachment;
         },
      },
   },
});
