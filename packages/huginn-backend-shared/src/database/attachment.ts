import { Prisma, prisma } from "#database";
import { WorkerID, snowflake } from "@huginn/shared";

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
