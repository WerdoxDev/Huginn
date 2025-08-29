import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";
import { createRoute, invalidFormBody, validator } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import { HttpCode, type APIPatchUserSettingsResult } from "@huginn/shared";
import z from "zod";

const schema = z.object({
   theme: z.optional(z.enum(["eggplant", "cerulean", "pine green", "coffee", "charcoal"])),
   status: z.optional(z.enum(["offline", "online", "dnd", "idle"])),
});

createRoute("PATCH", "/api/users/@me/settings", verifyJwt(), validator("json", schema), async (c) => {
   const payload = c.get("tokenPayload");
   const body = c.req.valid("json");

   if (Object.keys(body).length === 0) {
      return invalidFormBody(c);
   }

   const updatedSettings: APIPatchUserSettingsResult = await prisma.settings.updateSettings(payload.id, body);

   dispatchToTopic(payload.id, "settings_update", body);

   return c.json(updatedSettings, HttpCode.OK);
});
