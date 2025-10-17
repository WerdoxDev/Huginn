import { createErrorFactory, createHuginnError, missingPermission, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelDefaults } from "@huginn/backend-shared/database/common";
import { CDNRoutes, Errors, MessageFlags, MessageType, getFileHash, toArrayBuffer } from "@huginn/shared";
import { channelWithoutRecipient, dispatchChannel, dispatchMessage, filterChannel } from "#utils/helpers";
import { cdnUpload } from "#utils/server-request";
import { validateChannelName } from "#utils/validation";
import Elysia, { t } from "elysia";

const schema = t.Object({
   name: t.Optional(t.Nullable(t.String())),
   icon: t.Optional(t.Nullable(t.String())),
   owner: t.Optional(t.String()),
});

export const patchChannel = new Elysia().use(verifyJwt()).patch(
   "/api/channels/:channelId",
   async ({ params: { channelId }, status, body, tokenPayload }) => {
      const formError = createErrorFactory(Errors.invalidFormBody());

      validateChannelName(body.name, formError);

      if (formError.hasErrors()) {
         return createHuginnError(formError, status);
      }

      const channel = await prisma.channel.getById(channelId, { select: { name: true, icon: true, ownerId: true } });

      if (body.owner && channel.ownerId !== tokenPayload.id) {
         return missingPermission(status);
      }

      let channelIconHash: string | undefined | null = undefined;
      if (body.icon !== null && body.icon !== undefined) {
         const data = toArrayBuffer(body.icon);
         channelIconHash = getFileHash(data);

         channelIconHash = (
            await cdnUpload<string>(CDNRoutes.uploadChannelIcon(channelId), {
               files: [{ data: data, name: channelIconHash }],
            })
         ).split(".")[0];
      } else if (body.icon === null) {
         channelIconHash = null;
      }

      const updatedChannel = await prisma.channel.editDM(channelId, body.name, channelIconHash, body.owner, {
         select: selectChannelDefaults,
      });

      for (const recipient of updatedChannel.recipients) {
         dispatchChannel(filterChannel(updatedChannel), "channel_update", recipient.id);
      }

      if (channel.name !== updatedChannel.name) {
         await dispatchMessage({
            authorId: tokenPayload.id,
            channelId,
            type: MessageType.CHANNEL_NAME_CHANGED,
            content: updatedChannel.name ?? "",
            flags: MessageFlags.NONE,
         });
      }

      if (channel.icon !== updatedChannel.icon) {
         await dispatchMessage({ authorId: tokenPayload.id, channelId, type: MessageType.CHANNEL_ICON_CHANGED, flags: MessageFlags.NONE });
      }

      if (channel.ownerId !== updatedChannel.ownerId) {
         await dispatchMessage({
            authorId: tokenPayload.id,
            channelId,
            type: MessageType.CHANNEL_OWNER_CHANGED,
            mentions: [updatedChannel.ownerId || ""],
            flags: MessageFlags.NONE,
         });
      }

      return status("OK", channelWithoutRecipient(filterChannel(updatedChannel), tokenPayload.id));
   },
   { body: schema },
);
