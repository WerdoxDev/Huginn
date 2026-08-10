import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { CDNRoutes, getFileHash, toArrayBuffer, type BackgroundStyle, type Snowflake } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { dispatchToTopic } from "#utils/gateway-utils";
import { cdnUpload } from "#utils/server-request";

const backgroundStyleSchema = t.Object({
   color: t.Optional(t.String()),
   image: t.Optional(t.String()),
   imageDisplay: t.Optional(t.Union([t.Literal("cover"), t.Literal("contain")])),
   blur: t.Optional(t.Number()),
   dimming: t.Optional(t.Number()),
});

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
            ...backgroundStyleSchema.properties,
         }),
      ),
   ),
   globalChannelBackground: t.Optional(t.Union([backgroundStyleSchema, t.Null()])),
});

async function uploadBackgroundImage(background: BackgroundStyle, scope: Snowflake | "global", userId: Snowflake) {
   if (!background.image?.startsWith("data:")) return;

   const data = toArrayBuffer(background.image);
   const backgroundHash = (
      await cdnUpload<string>(CDNRoutes.uploadChannelBackground(scope, userId), {
         files: [{ data, name: getFileHash(data) }],
      })
   ).split(".")[0];

   background.image = backgroundHash;
}

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
            await uploadBackgroundImage(background, background.channelId, tokenPayload.id);
         }
      }

      if (finalSettings.globalChannelBackground) {
         if (!finalSettings.globalChannelBackground.color && !finalSettings.globalChannelBackground.image) return invalidBody(status);
         await uploadBackgroundImage(finalSettings.globalChannelBackground, "global", tokenPayload.id);
      }

      const updatedSettings = await prisma.settings.updateSettings(tokenPayload.id, finalSettings);

      dispatchToTopic(tokenPayload.id, "settings_update", updatedSettings);

      return status("OK", updatedSettings);
   },
   { body: schema },
);
