import { cors } from "@elysiajs/cors";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { staticPlugin } from "@elysiajs/static";
import { globalPlugin, invalidBody, notFound, serverError, serverOnError } from "@huginn/backend-shared";
import { logger } from "@huginn/backend-shared/logger";
import { Client, LogLevel } from "@notionhq/client";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import Elysia from "elysia";
import * as firebase from "firebase-admin/app";
import { NotionConverter } from "notion-to-md";
import { Octokit } from "octokit";
import { Resend } from "resend";

import { getAllReleases } from "#routes/all-releases.get";
import { postApplicationIcon } from "#routes/applications/icon.post";
import { getKnownApplications } from "#routes/applications/known.get";
import { postKnownApplication } from "#routes/applications/known.post";
import { getGoogleCallback } from "#routes/auth/callback/google.get";
import { getGoogle } from "#routes/auth/google.get";
import { postLogin } from "#routes/auth/login.post";
import { postLogout } from "#routes/auth/logout.post";
import { postNotificationToken } from "#routes/auth/notification-token.post";
import { postOauthConfirm } from "#routes/auth/oauth-confirm.post";
import { postRefreshToken } from "#routes/auth/refresh-token.post";
import { postRegister } from "#routes/auth/register.post";
import { getChangelog } from "#routes/changelog.get";
import { deleteChannel } from "#routes/channels/[channelId].delete";
import { getChannel } from "#routes/channels/[channelId].get";
import { patchChannel } from "#routes/channels/[channelId].patch";
import { postCallRing } from "#routes/channels/[channelId]/call/ring.post";
import { getChannelMessages } from "#routes/channels/[channelId]/messages.get";
import { postChannelMessage } from "#routes/channels/[channelId]/messages.post";
import { deleteMessage } from "#routes/channels/[channelId]/messages/[messageId].delete";
import { getMessage } from "#routes/channels/[channelId]/messages/[messageId].get";
import { patchMessage } from "#routes/channels/[channelId]/messages/[messageId].patch";
import { postAckMessage } from "#routes/channels/[channelId]/messages/[messageId]/ack.post";
import { deleteMeReaction } from "#routes/channels/[channelId]/messages/[messageId]/reactions/[emojiKey]/@me.delete";
import { putMeReaction } from "#routes/channels/[channelId]/messages/[messageId]/reactions/[emojiKey]/@me.put";
import { getChannelMessagePins } from "#routes/channels/[channelId]/messages/pins.get";
import { deleteChannelMessagePin } from "#routes/channels/[channelId]/messages/pins/[messageId].delete";
import { putChannelMessagePin } from "#routes/channels/[channelId]/messages/pins/[messageId].put";
import { deleteChannelRecipient } from "#routes/channels/[channelId]/recipients/[recipientId].delete";
import { putChannelRecipient } from "#routes/channels/[channelId]/recipients/[recipientId].put";
import { postTyping } from "#routes/channels/[channelId]/typing.post";
import { ws } from "#routes/gateway";
import { getGifCategories } from "#routes/gifs/categories.get";
import { getSearchGifs } from "#routes/gifs/search.get";
import { getTrendingGifs } from "#routes/gifs/trending.get";
import { getLatestRelease } from "#routes/latest-release.get";
import { postLog } from "#routes/log.post";
import { getOnlineUsers } from "#routes/online-users.get";
import { postUniqueUsername } from "#routes/unique-username.post";
import { getAndroidUpdateAsset, postAndroidUpdate } from "#routes/update/android.post";
import { getWinUpdate } from "#routes/update/win.get";
import { getMe } from "#routes/users/@me.get";
import { patchMe } from "#routes/users/@me.patch";
import { getUserChannels } from "#routes/users/@me/channels.get";
import { postUserChannel } from "#routes/users/@me/channels.post";
import { getUserRelationships } from "#routes/users/@me/relationships.get";
import { postUserRelationship } from "#routes/users/@me/relationships.post";
import { deleteUserRelationship } from "#routes/users/@me/relationships/[userId].delete";
import { getUserRelationship } from "#routes/users/@me/relationships/[userId].get";
import { putUserRelationship } from "#routes/users/@me/relationships/[userId].put";
import { postResendVerificationEmail } from "#routes/users/@me/resend-verification-email";
import { patchUserSettings } from "#routes/users/@me/settings.patch";
import { postVerifyEmail } from "#routes/users/@me/verify-email.post";
import { getUser } from "#routes/users/[userId].get";
import { getUserProfile } from "#routes/users/[userId]/profile.get";
import { env } from "#setup";

import { ServerGateway } from "./gateway/server-gateway";
import { getIndex } from "./routes";

export const gateway = new ServerGateway();
export const octokit: Octokit = new Octokit({ auth: env.GITHUB_TOKEN });

export const s3 = new Bun.S3Client({
   region: env.AWS_REGION,
   accessKeyId: env.AWS_KEY_ID,
   secretAccessKey: env.AWS_SECRET_KEY,
});

export const resend = new Resend(env.RESEND_API_KEY);

export const notion = new Client({ auth: env.NOTION_TOKEN, notionVersion: "2026-03-11", logLevel: LogLevel.ERROR });

export const n2m = new NotionConverter(notion);

firebase.initializeApp({
   credential: firebase.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
   }),
});

export const app = new Elysia({
   cookie: {
      secrets: env.SESSION_PASSWORD,
      sign: ["oauth"],
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 60 * 5,
   },
   normalize: "typebox",
})
   .use(cors())
   .use(staticPlugin({ prefix: "", assets: "public", alwaysStatic: true }))
   .use(globalPlugin)
   .use(
      opentelemetry({
         serviceName: env.OTEL_SERVICE_NAME,
         spanProcessors: [
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: env.OTLP_TRACE_URL,
               }),
            ),
         ],
      }),
   )
   .onError(function onError({ error, code, status, path, request }) {
      if (code === "UNKNOWN") {
         const returnedError = serverOnError(error, status);
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

      logger.error(error, "Request error");
      logger.debug({ error, code, path, method: request.method }, "Request error");
      return serverError(status);
   })
   .onAfterResponse(async function onAfterResponse({ global }) {
      if (global?.waitUntilPromises) {
         await Promise.allSettled(global.waitUntilPromises.map((x) => x()) ?? []);
      }
   })
   .ws("/gateway", {
      upgrade({ request, server }) {
         return ws.handleUpgrade(request, server!);
      },
   })
   // user
   .use(getUserChannels)
   .use(postUserChannel)
   .use(getUserRelationships)
   .use(postUserRelationship)
   .use(getUser)
   .use(getMe)
   .use(patchMe)
   .use(patchUserSettings)
   .use(deleteUserRelationship)
   .use(getUserRelationship)
   .use(putUserRelationship)
   .use(postVerifyEmail)
   .use(postResendVerificationEmail)
   .use(getUserProfile)

   // channel
   .use(postChannelMessage)
   .use(getChannelMessages)
   .use(deleteChannel)
   .use(getChannel)
   .use(patchChannel)
   .use(deleteChannelRecipient)
   .use(putChannelRecipient)
   .use(getChannelMessagePins)
   .use(putChannelMessagePin)
   .use(deleteChannelMessagePin)

   // message
   .use(patchMessage)
   .use(postAckMessage)
   .use(deleteMessage)
   .use(getMessage)
   .use(postTyping)
   .use(putMeReaction)
   .use(deleteMeReaction)

   // call
   .use(postCallRing)

   // auth
   .use(postLogin)
   .use(postRegister)
   .use(postLogout)
   .use(postOauthConfirm)
   .use(postRefreshToken)
   .use(getGoogle)
   .use(getGoogleCallback)
   .use(postNotificationToken)

   // applications
   .use(postApplicationIcon)
   .use(postKnownApplication)
   .use(getKnownApplications)

   // misc
   .use(getAllReleases)
   .use(getLatestRelease)
   .use(getOnlineUsers)
   .use(postUniqueUsername)
   .use(getWinUpdate)
   .use(postAndroidUpdate)
   .use(getAndroidUpdateAsset)
   .use(postLog)
   .use(getIndex)
   .use(getChangelog)

   // gifs
   .use(getGifCategories)
   .use(getTrendingGifs)
   .use(getSearchGifs);
