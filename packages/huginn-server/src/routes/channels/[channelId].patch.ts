import { createErrorFactory, createHuginnError, createRoute, missingPermission, validator, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { CDNRoutes, Errors, HttpCode, MessageFlags, MessageType, getFileHash, toArrayBuffer } from "@huginn/shared";
import { z } from "zod";
import { channelWithoutRecipient, dispatchChannel, dispatchMessage } from "#utils/helpers";
import { cdnUpload } from "#utils/server-request";
import { validateChannelName } from "#utils/validation";
("@huginn/backend-shared/database/common");

const schema = z.object({
   name: z.optional(z.nullable(z.string())),
   icon: z.optional(z.nullable(z.string())),
   owner: z.optional(z.string()),
});

createRoute("PATCH", "/api/channels/:channelId", verifyJwt(), validator("json", schema), async (c) => {
   const payload = c.get("tokenPayload");
   const { channelId } = c.req.param();
   const body = c.req.valid("json");

   const formError = createErrorFactory(Errors.invalidFormBody());

   validateChannelName(body.name, formError);

   if (formError.hasErrors()) {
      return createHuginnError(c, formError);
   }

   const channel = await prisma.channel.getById(channelId, { select: { name: true, icon: true, ownerId: true } });

   if (body.owner && channel.ownerId !== payload.id) {
      return missingPermission(c);
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

   const updatedChannel = await prisma.channel.editDM(channelId, body.name, channelIconHash, body.owner, { include: selectChannelRecipients });

   for (const recipient of updatedChannel.recipients) {
      dispatchChannel(updatedChannel, "channel_update", recipient.id);
   }

   if (channel.name !== updatedChannel.name) {
      await dispatchMessage({
         authorId: payload.id,
         channelId,
         type: MessageType.CHANNEL_NAME_CHANGED,
         content: updatedChannel.name ?? "",
         flags: MessageFlags.NONE,
      });
   }

   if (channel.icon !== updatedChannel.icon) {
      await dispatchMessage({ authorId: payload.id, channelId, type: MessageType.CHANNEL_ICON_CHANGED, flags: MessageFlags.NONE });
   }

   if (channel.ownerId !== updatedChannel.ownerId) {
      await dispatchMessage({
         authorId: payload.id,
         channelId,
         type: MessageType.CHANNEL_OWNER_CHANGED,
         mentions: [updatedChannel.ownerId || ""],
         flags: MessageFlags.NONE,
      });
   }

   return c.json(channelWithoutRecipient(updatedChannel, payload.id), HttpCode.OK);
});
