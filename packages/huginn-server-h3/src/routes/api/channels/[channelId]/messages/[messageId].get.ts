import { includeMessageAuthor, includeMessageMentions } from "@/database/common";
import { router } from "@/server";
import { prisma } from "@database";
import { unauthorized } from "@huginn/backend-shared";
import { APIGetMessageByIdResult, HttpCode, idFix, merge, omit } from "@huginn/shared";
import { useValidatedParams, useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ channelId: z.string(), messageId: z.string() });

router.get(
   "/channels/:channelId/messages/:messageId",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const { channelId, messageId } = await useValidatedParams(event, schema);

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return unauthorized(event);
      }

      const message: APIGetMessageByIdResult = omit(
         idFix(await prisma.message.getById(channelId, messageId, merge(includeMessageAuthor, includeMessageMentions))),
         ["authorId"],
      );

      setResponseStatus(event, HttpCode.OK);
      return message;
   }),
);
