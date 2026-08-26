import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessagePin } from "@huginn/backend-shared/database/common";
import { type APIGetChannelPinsResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { filterMessage } from "#utils/helpers";

const querySchema = t.Object({
   limit: t.Optional(t.Number()),
   before: t.Optional(t.String()),
});

export const getChannelMessagePins = new Elysia().use(verifyJwt()).get(
   "/api/channels/:channelId/messages/pins",
   {
      query: querySchema,
   },
   async ({ params: { channelId }, query: { before, limit }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });

      limit = limit ?? 50;

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return missingAccess(status);
      }

      const dbPins = await prisma.messagePin.getChannelPins(channelId, limit, before, {
         orderBy: { messageId: "desc" },
         select: selectMessagePin,
      });

      const json: APIGetChannelPinsResult = await Promise.all(
         dbPins.map(async (pin) => ({
            pinnedAt: pin.pinnedAt,
            message: await filterMessage(pin.message, { receiverId: tokenPayload.id }),
         })),
      );

      return status("OK", json);
   },
);
