import { WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "#database";

export const attachmentExtension = Prisma.defineExtension({
	model: {
		attachment: {
			async createAttachment<Args extends Prisma.AttachmentDefaultArgs>(
				filename: string,
				contentType: string,
				size: number,
				url: string,
				flags: number,
				width?: number,
				height?: number,
				description?: string,
				args?: Args,
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
					...args,
				});

				return attachment;
			},
		},
	},
});
