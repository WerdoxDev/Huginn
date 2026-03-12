import { assertExists, assertId, assertObj, prisma, Prisma } from "#database";
import { DBErrorType } from "#types";
import { defaultServerSettings, type APIPatchUserSettingsJSONBody, type Snowflake, type UserSettings } from "@huginn/shared";

export const settingsExtension = Prisma.defineExtension({
   model: {
      settings: {
         async getOrCreateSettings(userId: Snowflake) {
            const methodName = "settings.getOrCreateSettings";
            try {
               assertId(methodName, userId);

               const exists = await prisma.settings.exists({ userId: BigInt(userId) });

               let settings;
               if (!exists) {
                  settings = await prisma.settings.create({
                     data: { userId: BigInt(userId), json: defaultServerSettings },
                     select: { json: true },
                  });
               } else {
                  settings = await prisma.settings.findUnique({
                     where: { userId: BigInt(userId) },
                     select: { json: true },
                  });
               }

               assertObj(methodName, settings, DBErrorType.NULL_SETTINGS);

               return settings?.json as UserSettings;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId.toString()]);
               throw e;
            }
         },
         async updateSettings(userId: Snowflake, options: APIPatchUserSettingsJSONBody) {
            const methodName = "settings.getOrCreateSettings";
            try {
               assertId(methodName, userId);

               const currentSettings = await prisma.settings.getOrCreateSettings(userId);
               const updatedSettings = await prisma.settings.update({
                  where: { userId: BigInt(userId) },
                  data: { json: { ...currentSettings, ...options } },
                  select: { json: true },
               });
               assertObj(methodName, options, DBErrorType.NULL_SETTINGS);

               return updatedSettings.json as UserSettings;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId.toString()]);
               throw e;
            }
         },
      },
   },
});
