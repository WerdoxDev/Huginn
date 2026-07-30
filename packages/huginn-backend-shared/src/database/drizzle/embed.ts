import { WorkerID, analytics, recordSpanError, snowflake } from "@huginnjs/shared";

import type { DBThumbnail, DBVideo } from "#types";

import { drizzle } from "#database";

export const embedRepo = {
   async createOne(type: string, title?: string, description?: string, url?: string, timestamp?: string, thumbnail?: DBThumbnail, video?: DBVideo) {
      return analytics.startActiveSpan("db.embed.createOne", async (span) => {
         span.setAttributes({
            "query.type": type,
            "query.has_title": !!title,
            "query.has_url": !!url,
            "query.has_timestamp": !!timestamp,
            "query.has_thumbnail": !!thumbnail,
            "query.has_video": !!video,
            "query.has_description": !!description,
         });

         try {
            const embed = await drizzle.embed.create({
               data: {
                  id: snowflake.generate(WorkerID.EMBED),
                  title,
                  description,
                  url,
                  type,
                  timestamp,
               },
            });

            span.setAttribute("embed.id", embed.id.toString());

            if (thumbnail) {
               const createdThumbnail = await drizzle.thumbnail.create({
                  data: {
                     id: snowflake.generate(WorkerID.THUMBNAIL),
                     url: thumbnail.url,
                     height: thumbnail.height,
                     width: thumbnail.width,
                     embedId: embed.id,
                  },
               });

               span.setAttribute("embed.thumbnail.id", createdThumbnail.id.toString());
            }

            if (video) {
               const createdVideo = await drizzle.video.create({
                  data: {
                     id: snowflake.generate(WorkerID.VIDEO),
                     url: video.url,
                     height: video.height,
                     width: video.width,
                     embedId: embed.id,
                  },
               });
               span.setAttribute("embed.video.id", createdVideo.id.toString());
            }

            return embed;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   },
};
