import { type APIThumbnail, type Snowflake, WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "#database";

const embedExtension = Prisma.defineExtension({
	model: {
		embed: {
			async createEmbed(title?: string, description?: string, url?: string, type?: string, thumbnail?: APIThumbnail) {
				const embed = await prisma.embed.create({
					data: { id: snowflake.generate(WorkerID.EMBED), title, description, url, type },
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

export default embedExtension;
