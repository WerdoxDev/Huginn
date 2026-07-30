import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIGetChannelByIdResult, merge } from "@huginnjs/shared";
import Elysia from "elysia";

import { filterChannel } from "#utils/helpers";

export const getChannel = new Elysia().use(verifyJwt()).get("/api/channels/:channelId", async ({ status, params: { channelId }, tokenPayload }) => {
   const channel = await prisma.channel.getById(channelId, {
      select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)),
   });

   if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
      return missingAccess(status);
   }

   const json: APIGetChannelByIdResult = filterChannel(channel);
   return status("OK", json);
});
