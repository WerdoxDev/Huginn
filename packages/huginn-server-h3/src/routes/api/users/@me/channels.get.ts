import { includeChannelRecipients, excludeSelfChannelUser } from "@/database/common";
import { router } from "@/server";
import { prisma } from "@database";
import { APIGetUserChannelsResult, idFix, merge, HttpCode } from "@huginn/shared";
import { useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";

router.get(
   "/users/@me/channels",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);

      const channels: APIGetUserChannelsResult = idFix(
         await prisma.channel.getUserChannels(payload.id, false, merge(includeChannelRecipients, excludeSelfChannelUser(payload.id))),
      );

      setResponseStatus(event, HttpCode.OK);
      return channels;
   }),
);
