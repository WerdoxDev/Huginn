import { filterMessage } from "#utils/helpers";
import { missingAccess, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectMessagePin } from "@huginn/backend-shared/database/common";
import { type APIGetChannelPinsResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

const querySchema = t.Object({
   limit: t.Optional(t.Number()),
   before: t.Optional(t.String()),
});

export const getChannelMessagePins = new Elysia().use(verifyJwt()).get(
   "/api/channels/:channelId/messages/pins",
   async ({ params: { channelId }, query: { before, limit }, tokenPayload, status }) => {
      const channel = await prisma.channel.getById(channelId, { select: { id: true } });

      limit = limit ?? 50;

      if (!(await prisma.user.hasChannel(tokenPayload.id, channel.id))) {
         return missingAccess(status);
      }

      const dbPins = await prisma.messagePin.getChannelPins(channelId, limit, before, {
         where: { message: { deletedTimestamp: null } },
         orderBy: { messageId: "desc" },
         select: selectMessagePin,
      });

      const json: APIGetChannelPinsResult = dbPins.map((pin) => ({
         pinnedAt: pin.pinnedAt,
         message: filterMessage(pin.message),
      }));

      return status("OK", json);
   },
   {
      query: querySchema,
   },
);
