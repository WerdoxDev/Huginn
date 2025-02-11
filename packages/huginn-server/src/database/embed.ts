import { WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "#database";
import type { DBThumbnail } from "#utils/types";

export const embedExtension = Prisma.defineExtension({
	model: {
		embed: {
			async createEmbed(title?: string, description?: string, url?: string, timestamp?: string, type?: string, thumbnail?: DBThumbnail) {
				const embed = await prisma.embed.create({
					data: { id: snowflake.generate(WorkerID.EMBED), title, description, url, type, timestamp },
				});
				if (thumbnail) {
					await prisma.thumbnail.create({
						data: {
							id: snowflake.generate(WorkerID.THUMBNAIL),
							url: thumbnail.url,
							height: thumbnail.height,
							width: thumbnail.width,
							embed: { connect: { id: embed.id } },
						},
					});
				}

				return embed;
			},
		},
	},
});
