import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIGetUserChannelsResult, merge } from "@huginn/shared";
import Elysia from "elysia";

import { filterChannel } from "#utils/helpers";

export const getUserChannels = new Elysia().use(verifyJwt()).get("/api/users/@me/channels", async ({ tokenPayload, status }) => {
   const channels = await prisma.channel.getUserChannels(tokenPayload.id, false, {
      select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)),
   });

   const filteredChannels: APIGetUserChannelsResult = channels.map((x) => filterChannel(x));
   return status("OK", filteredChannels);
});
