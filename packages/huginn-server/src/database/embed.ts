import { WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "#database";
import type { DBThumbnail, DBVideo } from "#utils/types";

export const embedExtension = Prisma.defineExtension({
	model: {
		embed: {
			async createEmbed(
				title?: string,
				description?: string,
				url?: string,
				timestamp?: string,
				type?: string,
				thumbnail?: DBThumbnail,
				video?: DBVideo,
			) {
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

				if (video) {
					await prisma.video.create({
						data: {
							id: snowflake.generate(WorkerID.THUMBNAIL),
							url: video.url,
							height: video.height,
							width: video.width,
							embed: { connect: { id: embed.id } },
						},
					});
				}

				return embed;
			},
		},
	},
});
