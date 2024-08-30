import { prisma } from "@/database";
import { includeChannelRecipients, excludeSelfChannelUser } from "@/database/common";
import { dispatchToTopic } from "@utils/gateway-utils";
import { gateway, router } from "@/server";
import { useValidatedBody, useVerifiedJwt } from "@/utils/route-utils";
import { invalidFormBody } from "@huginn/backend-shared";
import { APIPostDMChannelResult, HttpCode, idFix, merge } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ recipients: z.array(z.string()) });

router.post(
   "/users/@me/channels",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const body = await useValidatedBody(event, schema);

      if (body.recipients.length === 0) {
         return invalidFormBody(event);
      }

      const channel: APIPostDMChannelResult = idFix(
         await prisma.channel.createDM(
            payload.id,
            body.recipients,
            merge(includeChannelRecipients, excludeSelfChannelUser(payload.id)),
         ),
      );

      for (const id of [payload.id, ...body.recipients]) {
         gateway.getSession(id)?.subscribe(channel.id);
      }

      dispatchToTopic(payload.id, "channel_create", channel);

      setResponseStatus(event, HttpCode.CREATED);
      return channel;
   }),
);
