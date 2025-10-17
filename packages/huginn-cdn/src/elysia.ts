import { postApplicationIcon } from "#routes/application-icons/[applicationId!].post";
import { getApplicationIcon } from "#routes/application-icons/[applicationId!]/[iconHash].get";
import { postMessageAttachment } from "#routes/attachments/[channelId]/[messageId].post";
import { getMessageAttachment } from "#routes/attachments/[channelId]/[messageId]/[filename].get";
import { postUserAvatar } from "#routes/avatars/[userId].post";
import { getUserAvatar } from "#routes/avatars/[userId]/[avatarHash].get";
import { postChannelIcon } from "#routes/channel-icons/[channelId].post";
import { getChannelIcon } from "#routes/channel-icons/[channelId]/[iconHash].get";
import cors from "@elysiajs/cors";
import { cdnOnError, globalPlugin, invalidBody, serverError } from "@huginn/backend-shared";
import consola from "consola";
import Elysia from "elysia";
import { getIndex } from "./routes";

export const main = new Elysia()
   .use(cors())
   .use(globalPlugin)
   .onError(({ error, code, status, path, request }) => {
      consola.box(path, request.method, error);
      if (code === "UNKNOWN") {
         const returnedError = cdnOnError(error, status);
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
   .use(getIndex)
   .use(getApplicationIcon)
   .use(postApplicationIcon)
   .use(getMessageAttachment)
   .use(postMessageAttachment)
   .use(getUserAvatar)
   .use(postUserAvatar)
   .use(getChannelIcon)
   .use(postChannelIcon);
