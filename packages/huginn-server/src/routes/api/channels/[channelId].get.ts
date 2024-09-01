import { includeChannelRecipients } from "#database/common";
import { router } from "#server";
import { prisma } from "#database";
import { createErrorFactory, notFound, useValidatedParams } from "@huginn/backend-shared";
import { APIGetChannelByIdResult, Errors, HttpCode, idFix } from "@huginn/shared";
import { useVerifiedJwt } from "#utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ channelId: z.string() });

router.get(
   "/channels/:channelId",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const channelId = (await useValidatedParams(event, schema)).channelId;

      if (!(await prisma.user.hasChannel(payload.id, channelId))) {
         return notFound(event, createErrorFactory(Errors.unknownChannel(channelId)));
      }

      const channel: APIGetChannelByIdResult = idFix(await prisma.channel.getById(channelId, includeChannelRecipients));

      setResponseStatus(event, HttpCode.OK);
      return channel;
   }),
);
