import { prisma } from "@huginn/backend-shared/database/index";
import { idFix, type UserSettings } from "@huginnjs/shared";

const settings = idFix(await prisma.settings.findMany());
for (const setting of settings) {
   const json = setting.json as UserSettings;
   for (const gif of json.favoriteGifs ?? []) {
      if (!gif.timestamp) {
         gif.timestamp = Date.now();
      }
   }
   await prisma.settings.updateSettings(setting.userId, json);
}
