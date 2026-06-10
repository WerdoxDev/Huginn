import cors from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { cdnOnError, globalPlugin, invalidBody, notFound, serverError } from "@huginn/backend-shared";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import consola from "consola";
import Elysia from "elysia";

import { postApplicationIcon } from "#routes/application-icons/[applicationId!].post";
import { getApplicationIcon } from "#routes/application-icons/[applicationId!]/[iconHash].get";
import { postMessageAttachment } from "#routes/attachments/[channelId]/[messageId].post";
import { getMessageAttachment } from "#routes/attachments/[channelId]/[messageId]/[filename].get";
import { postUserAvatar } from "#routes/avatars/[userId].post";
import { getUserAvatar } from "#routes/avatars/[userId]/[avatarHash].get";
import { postUserBanner } from "#routes/banners/[userId].post";
import { getUserBanner } from "#routes/banners/[userId]/[bannerHash].get";
import { postChannelIcon } from "#routes/channel-icons/[channelId].post";
import { getChannelIcon } from "#routes/channel-icons/[channelId]/[iconHash].get";
import { getEmoji } from "#routes/emoji/[name].get";
import { envs } from "#setup";

import { getIndex } from "./routes";

export const main = new Elysia({})
   .use(cors())
   .use(globalPlugin)
   .use(
      opentelemetry({
         serviceName: envs.OTEL_SERVICE_NAME,
         spanProcessors: [
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: envs.SIGNOZ_API_URL,
               }),
            ),
         ],
      }),
   )
   .onError(({ error, code, status, path, request }) => {
      consola.box(path, request.method, code, error);
      if (code === "UNKNOWN") {
         const returnedError = cdnOnError(error, status);
         if (returnedError) {
            return returnedError;
         }
      } else if (code === "VALIDATION" || code === "PARSE") {
         return invalidBody(status);
      } else if (code === "INTERNAL_SERVER_ERROR") {
         return serverError(status);
      } else if (code === "NOT_FOUND") {
         return notFound(status);
      }

      return serverError(status);
   })
   .onAfterResponse(async ({ global }) => {
      if (global?.waitUntilPromises) {
         await Promise.allSettled(global.waitUntilPromises.map((x) => x()) ?? []);
      }
   })

   // Uncached routes
   .use(getApplicationIcon)
   .use(postApplicationIcon)
   .use(getMessageAttachment)
   .use(postMessageAttachment)
   .use(getIndex)

   // Cached routes
   .onAfterHandle(({ request, set }) => {
      const url = new URL(request.url);

      if (/(avatars|channel-icons|banners)/i.test(url.pathname)) {
         set.headers["Vary"] = "Accept-Encoding";
         set.headers["Cache-Control"] = "private, max-age=31536000";
      } else if (/(emoji)/i.test(url.pathname)) {
         set.headers["Vary"] = "Accept-Encoding";
         set.headers["Cache-Control"] = "private, max-age=31536000, immutable";
      }
   })
   .use(getUserAvatar)
   .use(postUserAvatar)
   .use(getUserBanner)
   .use(postUserBanner)
   .use(getChannelIcon)
   .use(postChannelIcon)
   .use(getEmoji)

   .listen({ hostname: envs.CDN_HOST, port: envs.CDN_PORT, idleTimeout: 40 }, (server) => {
      consola.box(`Listening on ${server.hostname}:${server.port}`);
   });
