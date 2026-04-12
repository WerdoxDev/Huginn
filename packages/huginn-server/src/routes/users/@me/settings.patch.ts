import { dispatchToTopic } from "#utils/gateway-utils";
import { invalidBody, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { type APIPatchUserSettingsResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   theme: t.Optional(
      t.Union([
         t.Literal("eggplant"),
         t.Literal("cerulean"),
         t.Literal("pine green"),
         t.Literal("coffee"),
         t.Literal("charcoal"),
         t.Literal("scarlet"),
      ]),
   ),
   status: t.Optional(t.Union([t.Literal("offline"), t.Literal("online"), t.Literal("dnd"), t.Literal("idle")])),
   pinnedChannels: t.Optional(t.Array(t.String())),
});

export const patchUserSettings = new Elysia().use(verifyJwt()).patch(
   "/api/users/@me/settings",
   async ({ body, tokenPayload, status }) => {
      if (Object.keys(body).length === 0) {
         return invalidBody(status);
      }

      const updatedSettings: APIPatchUserSettingsResult = await prisma.settings.updateSettings(tokenPayload.id, body);

      dispatchToTopic(tokenPayload.id, "settings_update", body);

      return status("OK", updatedSettings);
   },
   { body: schema },
);
