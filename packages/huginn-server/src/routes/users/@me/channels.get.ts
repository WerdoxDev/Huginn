import { filterChannel } from "#utils/helpers";
import { createRoute, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIGetUserChannelsResult, HttpCode, merge } from "@huginn/shared";

createRoute("GET", "/api/users/@me/channels", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");

   const channels = await prisma.channel.getUserChannels(payload.id, false, {
      select: merge(selectChannelDefaults, omitChannelRecipient(payload.id)),
   });

   const filteredChannels: APIGetUserChannelsResult = channels.map((x) => filterChannel(x));

   return c.json(filteredChannels, HttpCode.OK);
});
