import { getAllReleases } from "#routes/all-releases.get";
import { postApplicationIcon } from "#routes/applications/icon.post";
import { getKnownApplications } from "#routes/applications/known.get";
import { postKnownApplication } from "#routes/applications/known.post";
import { getGoogleCallback } from "#routes/auth/callback/google.get";
import { getGoogle } from "#routes/auth/google.get";
import { postLogin } from "#routes/auth/login.post";
import { postLogout } from "#routes/auth/logout.post";
import { postOauthConfirm } from "#routes/auth/oauth-confirm.post";
import { postRefreshToken } from "#routes/auth/refresh-token.post";
import { postRegister } from "#routes/auth/register.post";
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
import { deleteChannelRecipient } from "#routes/channels/[channelId]/recipients/[recipientId].delete";
import { putChannelRecipient } from "#routes/channels/[channelId]/recipients/[recipientId].put";
import { postTyping } from "#routes/channels/[channelId]/typing.post";
import { getLatestRelease } from "#routes/latest-release.get";
import { postLog } from "#routes/log.post";
import { getOnlineUsers } from "#routes/online-users.get";
import { postUniqueUsername } from "#routes/unique-username.post";
import { getUpdate } from "#routes/update.get";
import { getMe } from "#routes/users/@me.get";
import { patchMe } from "#routes/users/@me.patch";
import { getUserChannels } from "#routes/users/@me/channels.get";
import { postUserChannel } from "#routes/users/@me/channels.post";
import { getUserRelationships } from "#routes/users/@me/relationships.get";
import { postUserRelationship } from "#routes/users/@me/relationships.post";
import { deleteUserRelationship } from "#routes/users/@me/relationships/[userId].delete";
import { getUserRelationship } from "#routes/users/@me/relationships/[userId].get";
import { putUserRelationship } from "#routes/users/@me/relationships/[userId].put";
import { patchUserSettings } from "#routes/users/@me/settings.patch";
import { getUser } from "#routes/users/[userId].get";
import { envs } from "#setup";
import { globalPlugin, invalidBody, serverError, serverOnError } from "@huginn/backend-shared";
import Elysia from "elysia";
import { getIndex } from "./routes";
import { staticPlugin } from "@elysiajs/static";
import { cors } from "@elysiajs/cors";
import consola from "consola";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";

console.log(envs.AXIOM_DATASET, envs.AXIOM_TOKEN);

export const main = new Elysia({
   cookie: { secrets: envs.SESSION_PASSWORD, sign: ["oauth"], httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 5 },
})
   .use(cors())
   .use(staticPlugin({ prefix: "" }))
   .use(globalPlugin)
   .use(
      opentelemetry({
         spanProcessors: [
            new BatchSpanProcessor(
               new OTLPTraceExporter({
                  url: "https://api.axiom.co/v1/traces",
                  headers: {
                     Authorization: `Bearer ${envs.AXIOM_TOKEN}`,
                     "X-Axiom-Dataset": envs.AXIOM_DATASET!,
                  },
               }),
            ),
         ],
      }),
   )
   .onError(({ error, code, status, path, request }) => {
      consola.box(path, request.method, error);
      if (code === "UNKNOWN") {
         const returnedError = serverOnError(error, status);
         // console.log(returnedError);
         if (returnedError) {
            return returnedError;
         }
      } else if (code === "VALIDATION" || code === "PARSE") {
         return invalidBody(status);
      } else if (code === "INTERNAL_SERVER_ERROR") {
         return serverError(status);
      }

      return serverError(status);
   })
   .onAfterResponse(async ({ global }) => {
      if (global.waitUntilPromises) {
         await Promise.allSettled(global.waitUntilPromises.map((x) => x()) ?? []);
      }
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

   // channel
   .use(postChannelMessage)
   .use(getChannelMessages)
   .use(deleteChannel)
   .use(getChannel)
   .use(patchChannel)
   .use(deleteChannelRecipient)
   .use(putChannelRecipient)

   // message
   .use(patchMessage)
   .use(postAckMessage)
   .use(deleteMessage)
   .use(getMessage)
   .use(postTyping)

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

   // applications
   .use(postApplicationIcon)
   .use(postKnownApplication)
   .use(getKnownApplications)

   // misc
   .use(getAllReleases)
   .use(getLatestRelease)
   .use(getOnlineUsers)
   .use(postUniqueUsername)
   .use(getUpdate)
   .use(postLog)
   .use(getIndex);
