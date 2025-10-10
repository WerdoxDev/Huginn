import { filterChannel } from "#utils/helpers";
import { elysia, verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitChannelRecipient, selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIGetChannelByIdResult, merge } from "@huginn/shared";
import Elysia from "elysia";

export const getChannel = new Elysia()
   .use(verifyJwt2())
   .get("/api/channels/:channelId", async ({ status, params: { channelId }, tokenPayload }) => {
      const channel = await prisma.channel.getById(channelId, {
         select: merge(selectChannelDefaults, omitChannelRecipient(tokenPayload.id)),
      });

      if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
         return elysia.missingAccess(status);
      }

      const json: APIGetChannelByIdResult = filterChannel(channel);
      return status("OK", json);
   });
