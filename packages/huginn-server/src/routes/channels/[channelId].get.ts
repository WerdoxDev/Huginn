import { filterChannel } from "#utils/helpers";
import { createRoute, missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIGetChannelByIdResult, HttpCode, merge } from "@huginn/shared";

createRoute("GET", "/api/channels/:channelId", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId } = c.req.param();

   const channel = await prisma.channel.getById(channelId, {
      select: merge(selectChannelDefaults, omitChannelRecipient(payload.id)),
   });

   if (!(await prisma.user.hasChannel(payload.id, channelId))) {
      return missingAccess(c);
   }

   const json: APIGetChannelByIdResult = filterChannel(channel);
   return c.json(json, HttpCode.OK);
});
