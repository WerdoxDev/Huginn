import {
   DEFAULT_SERVER_SETTINGS,
   analytics,
   recordSpanError,
   type APIPatchUserSettingsJSONBody,
   type Snowflake,
   type UserSettings,
} from "@huginn/shared";

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

                  const exists = await prisma.settings.exists({ userId: BigInt(userId) });

                  span.setAttribute("settings.exists", exists);

                  let settings;
                  if (!exists) {
                     settings = await prisma.settings.create({
                        data: { userId: BigInt(userId), json: DEFAULT_SERVER_SETTINGS },
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
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId.toString()]);
                  throw e;
               } finally {
                  span.end();
               }
            });
         },
         async updateSettings(userId: Snowflake, options: APIPatchUserSettingsJSONBody) {
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
               } finally {
                  span.end();
               }
            });
         },
      },
   },
});
