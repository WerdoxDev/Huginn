import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { channelWithoutRecipient, filterChannel } from "#utils/helpers";
import { validateChannelName } from "#utils/validation";
import { createErrorFactory, createHuginnError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { type APIPostDMChannelResult, ChannelType, Errors } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   name: t.Optional(t.String()),
   recipients: t.Array(t.String(), { minItems: 1 }),
});

export const postUserChannel = new Elysia().use(verifyJwt()).post(
   "/api/users/@me/channels",
   async ({ body, tokenPayload, status }) => {
      const formError = createErrorFactory(Errors.invalidFormBody());

      validateChannelName(body.name, formError);

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      // Create dm
      const createdChannel = filterChannel(
         await prisma.channel.createDirect(tokenPayload.id, body.recipients, body.name, {
            select: selectChannelDefaults,
         }),
      );

      // Subscribe topics, dispatch channel create event, create read state
      for (const recipientId of createdChannel.recipients.map((x) => x.id)) {
         const channel = channelWithoutRecipient(createdChannel, recipientId);
         gateway.subscribeSessionsToTopic(recipientId, createdChannel.id);

         if (channel.type === ChannelType.GROUP_DM || recipientId === tokenPayload.id) {
            dispatchToTopic(recipientId, "channel_create", channel);
         }

         // TODO: OPTIMIZE THIS: This can be a single query call with createMany
         await prisma.readState.createState(recipientId, createdChannel.id);
      }

      const json: APIPostDMChannelResult = channelWithoutRecipient(createdChannel, tokenPayload.id);
      return status("Created", json);
   },
   { body: schema },
);
