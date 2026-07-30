import { DEFAULT_SERVER_SETTINGS, analytics, recordSpanError, type APIPatchUserSettingsJSONBody, type Snowflake, type UserSettings } from "@huginnjs/shared";

import { assertExists, assertId, assertObj, prisma, Prisma } from "#database";
import { DBErrorType } from "#types";

export const settingsExtension = Prisma.defineExtension({
   model: {
      settings: {
         async getOrCreateSettings(userId: Snowflake) {
            return analytics.startActiveSpan("db.settings.getOrCreateSettings", async (span) => {
               span.setAttribute("query.user.id", userId);
               const methodName = "settings.getOrCreateSettings";
               try {
                  assertId(methodName, userId);

                  const settings = await prisma.settings.upsert({
                     where: { userId: BigInt(userId) },
                     create: { userId: BigInt(userId), json: DEFAULT_SERVER_SETTINGS },
                     update: {},
                     select: { json: true },
                  });

                  return settings?.json as UserSettings;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId.toString()]);
                  throw e;
               }
            });
         },
         async updateSettings(userId: Snowflake, options: Partial<UserSettings>) {
            return analytics.startActiveSpan("db.settings.updateSettings", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.key_count": Object.keys(options).length });
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
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId.toString()]);
                  throw e;
               }
            });
         },
      },
   },
});
