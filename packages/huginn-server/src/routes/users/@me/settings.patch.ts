import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { CDNRoutes, getFileHash, toArrayBuffer } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { cdnUpload } from "#utils/server-request";

const schema = t.Object({
   theme: t.Optional(t.Union([t.Literal("plum"), t.Literal("cerulean"), t.Literal("pine-green"), t.Literal("coffee"), t.Literal("violet"), t.Literal("rose")])),
   status: t.Optional(t.Union([t.Literal("offline"), t.Literal("online"), t.Literal("dnd"), t.Literal("idle")])),
   pinnedChannels: t.Optional(t.Array(t.String())),
   favoriteGifs: t.Optional(t.Array(t.Object({ url: t.String(), src: t.String(), width: t.Number(), height: t.Number(), timestamp: t.Number() }))),
   voicePreferences: t.Optional(
      t.Array(
         t.Object({ userId: t.String(), microphoneVolume: t.Number(), isMicrophoneMuted: t.Boolean(), streamVolume: t.Number(), isStreamMuted: t.Boolean() }),
      ),
   ),
   channelBackgrounds: t.Optional(
      t.Array(
         t.Object({
            channelId: t.String(),
            color: t.Optional(t.String()),
            image: t.Optional(t.String()),
            imageDisplay: t.Optional(t.Union([t.Literal("cover"), t.Literal("contain")])),
            blur: t.Optional(t.Number()),
            dimming: t.Optional(t.Number()),
         }),
      ),
   ),
});

export const patchUserSettings = new Elysia().use(verifyJwt()).patch(
   "/api/users/@me/settings",
   async ({ body, tokenPayload, status }) => {
      if (Object.keys(body).length === 0) {
         return invalidBody(status);
      }

      const finalSettings = { ...body };

      if (finalSettings.channelBackgrounds) {
         for (const background of finalSettings.channelBackgrounds) {
            if (!background.color && !background.image) return invalidBody(status);

            if (background.image && background.image.startsWith("data:")) {
               let backgroundHash: string | undefined;
               const data = toArrayBuffer(background.image);
               backgroundHash = getFileHash(data);
               backgroundHash = (
                  await cdnUpload<string>(CDNRoutes.uploadChannelBackground(background.channelId, tokenPayload.id), {
                     files: [{ data: data, name: backgroundHash }],
                  })
               ).split(".")[0];

               background.image = backgroundHash;
            }
         }
      }

      const updatedSettings = await prisma.settings.updateSettings(tokenPayload.id, finalSettings);

      dispatchToTopic(tokenPayload.id, "settings_update", updatedSettings);

      return status("OK", updatedSettings);
   },
   { body: schema },
);
