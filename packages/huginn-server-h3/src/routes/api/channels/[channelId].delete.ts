import { includeChannelRecipients } from "@/database/common";
import { router } from "@/server";
import { prisma } from "@database";
import { notFound, createErrorFactory } from "@huginn/backend-shared";
import { Errors, APIDeleteDMChannelResult, idFix, HttpCode } from "@huginn/shared";
import { dispatchToTopic } from "@utils/gateway-utils";
import { useValidatedParams, useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ channelId: z.string() });

router.delete(
   "/channels/:channelId",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const channelId = (await useValidatedParams(event, schema)).channelId;

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(event, createErrorFactory(Errors.unknownChannel(channelId)));
      }

      const channel: APIDeleteDMChannelResult = idFix(await prisma.channel.deleteDM(channelId, payload.id, includeChannelRecipients));

      dispatchToTopic(payload.id, "channel_delete", channel);
      // gateway.getSession(payload.id)?.unsubscribe(channel.id);

      setResponseStatus(event, HttpCode.OK);
      return channel;
   }),
);
