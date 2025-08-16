import { createErrorFactory, createHuginnError, createRoute, missingAccess, validator, waitUntil } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { constants, Errors, HttpCode } from "@huginn/shared";
import { z } from "zod";
import { gateway } from "#setup";
import { dispatchCallMessage } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";

const schema = z.object({ recipients: z.nullable(z.array(z.string())) });

createRoute("POST", "/api/channels/:channelId/call/ring", verifyJwt(), validator("json", schema), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId } = c.req.param();
   const body = c.req.valid("json");

   const channel = await prisma.channel.getById(channelId, {
      select: { id: true, recipients: { where: { id: { not: BigInt(payload.id) } }, select: { id: true } } },
   });

   if (!(await prisma.user.hasChannel(payload.id, channelId))) {
      return missingAccess(c);
   }

   if (body.recipients && !body.recipients?.every((x) => channel.recipients.some((y) => y.id === x))) {
      return createHuginnError(c, createErrorFactory(Errors.unknownUser(body.recipients)));
   }

   const callState = gateway.voiceManager.getCallStates([channel.id]);
   if (callState.length > 0) {
      return c.newResponse(null, HttpCode.NO_CONTENT);
   }

   const message = await dispatchCallMessage({ authorId: payload.id, channelId });

   gateway.voiceManager.addCall(
      channelId,
      message.id,
      payload.id,
      channel.recipients.map((x) => x.id),
   );

   waitUntil(c, async () => {
      await new Promise((r) => setTimeout(r, constants.CALL_RINGING_TIMEOUT));
      gateway.voiceManager.updateCall(channelId, []);
   });

   return c.newResponse(null, HttpCode.NO_CONTENT);
});
