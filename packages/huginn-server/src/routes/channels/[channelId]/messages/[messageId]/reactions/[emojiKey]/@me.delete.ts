import { missingAccess, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { decodeEmojiKey, Errors } from "@huginn/shared";
import { Elysia } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";

export const deleteMeReaction = new Elysia()
   .use(verifyJwt())
   .delete(
      "/api/channels/:channelId/messages/:messageId/reactions/:emojiKey/@me",
      async ({ params: { channelId, messageId, emojiKey }, tokenPayload, status }) => {
         if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
            return missingAccess(status);
         }

         // const message = await prisma.message.getById(channelId, messageId, { select: { authorId: true } });

         const decodedEmojiKey = decodeURIComponent(emojiKey);
         const emoji = decodeEmojiKey(decodedEmojiKey);
         if (!emoji) return singleError(Errors.unknownEmoji(decodedEmojiKey), status);

         const hasReacted = await prisma.reaction.hasUserReacted({
            channelId,
            messageId,
            userId: tokenPayload.id,
            emojiKey: decodedEmojiKey,
         });
         if (!hasReacted) {
            return status("No Content");
         }

         await prisma.reaction.decrementOrDelete({
            userId: tokenPayload.id,
            messageId,
            channelId,
            emojiKey: decodedEmojiKey,
         });

         dispatchToTopic(channelId, "message_reaction_remove", {
            channelId,
            messageId,
            userId: tokenPayload.id,
            // messageAuthorId: message.authorId,
            emoji: { id: null, name: decodedEmojiKey },
         });

         return status("No Content");
      },
   );
