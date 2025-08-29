import { assertExists, assertId, assertObj, prisma, Prisma } from "#database";
import { DBErrorType } from "#types";
import { defaultServerSettings, type APIPatchUserSettingsJSONBody, type Snowflake, type UserSettings } from "@huginn/shared";

export const settingsExtension = Prisma.defineExtension({
   model: {
      settings: {
         async getOrCreateSettings(userId: Snowflake) {
            try {
               assertId("getOrCreateSettings", userId);

               const exists = await prisma.settings.exists({ userId: BigInt(userId) });

               let settings;
               if (!exists) {
                  settings = await prisma.settings.create({
                     data: { userId: BigInt(userId), json: defaultServerSettings },
                     select: { json: true },
                  });
               } else {
                  settings = await prisma.settings.findUnique({ where: { userId: BigInt(userId) }, select: { json: true } });
               }

               assertObj("getOrCreateSettings", settings, DBErrorType.NULL_SETTINGS);

               return settings?.json as UserSettings;
            } catch (e) {
               await assertExists(e, "getOrCreateSettings", DBErrorType.NULL_USER, [userId.toString()]);
               throw e;
            }
         },
         async updateSettings(userId: Snowflake, settings: APIPatchUserSettingsJSONBody) {
            try {
               assertId("updateSettings", userId);

               const currentSettings = await prisma.settings.getOrCreateSettings(userId);
               const updatedSettings = await prisma.settings.update({
                  where: { userId: BigInt(userId) },
                  data: { json: { ...currentSettings, ...settings } },
                  select: { json: true },
               });
               assertObj("updateSettings", settings, DBErrorType.NULL_SETTINGS);

               return updatedSettings.json as UserSettings;
            } catch (e) {
               await assertExists(e, "updateSettings", DBErrorType.NULL_USER, [userId.toString()]);
               throw e;
            }
         },
      },
   },
});
