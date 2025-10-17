import { missingAccess, singleError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { constants, Errors } from "@huginn/shared";
import { gateway } from "#setup";
import { dispatchCallMessage } from "#utils/helpers";
import Elysia, { t } from "elysia";

const schema = t.Object({ recipients: t.Nullable(t.Array(t.String())) });

export const postCallRing = new Elysia().use(verifyJwt()).post(
   "/api/channels/:channelId/call/ring",
   async ({ body, params: { channelId }, status, tokenPayload }) => {
      const channel = await prisma.channel.getById(channelId, {
         select: { id: true, recipients: { where: { id: { not: BigInt(tokenPayload.id) } }, select: { id: true } } },
      });

      if (!(await prisma.user.hasChannel(tokenPayload.id, channelId))) {
         return missingAccess(status);
      }

      if (body.recipients && !body.recipients?.every((x) => channel.recipients.some((y) => y.id === x))) {
         return singleError(Errors.unknownUser(body.recipients), status);
      }

      const callState = gateway.voiceManager.getCallStates([channel.id]);
      if (callState.length > 0) {
         return status("No Content");
      }

      const message = await dispatchCallMessage({ authorId: tokenPayload.id, channelId });

      gateway.voiceManager.addCall(
         channelId,
         message.id,
         tokenPayload.id,
         channel.recipients.map((x) => x.id),
      );

      return status("No Content");
   },
   {
      body: schema,
      async afterResponse({ params: { channelId } }) {
         await new Promise((r) => setTimeout(r, constants.CALL_RINGING_TIMEOUT));
         gateway.voiceManager.updateCall(channelId, []);
      },
   },
);
