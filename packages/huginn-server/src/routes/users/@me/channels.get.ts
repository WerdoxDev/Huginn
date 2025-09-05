import { createRoute, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIGetUserChannelsResult, HttpCode, merge } from "@huginn/shared";

createRoute("GET", "/api/users/@me/channels", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");

   const channels: APIGetUserChannelsResult = await prisma.channel.getUserChannels(payload.id, false, {
      include: merge(selectChannelRecipients, omitChannelRecipient(payload.id)),
   });

   return c.json(channels, HttpCode.OK);
});
