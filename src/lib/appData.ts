import { BaseDirectory, createDir, exists, readTextFile, writeFile } from "@tauri-apps/api/fs";

export let settingsContent: AppSettings;

/**
 * Read the settings file and set settings
 */
export async function readSettingsFile() {
   await createSettingsFile();

   settingsContent = JSON.parse(await readTextFile("./data/settings.json", { dir: BaseDirectory.AppData }));
   // console.log(settingsContent);

   return settingsContent;
}

/**
 * Write the settings file and refreshes the settings
 */
export async function writeSettingsFile(settingsToOverride: AppSettings) {
   const fileSettings = await readSettingsFile();
   const finalSettings: AppSettings = { ...fileSettings, ...settingsToOverride };

   console.log(finalSettings);

   settingsContent = finalSettings;

   await writeFile({ contents: JSON.stringify(finalSettings, null, 2), path: "./data/settings.json" }, { dir: BaseDirectory.AppData });
}

/**
 * Creates a settings.json file if it doesn't exist
 */
async function createSettingsFile() {
   await createDataDir();

   if (!(await exists("data/settings.json", { dir: BaseDirectory.AppData }))) {
      const settings = getDefaultSettings();
      await writeFile({ contents: JSON.stringify(settings, null, 2), path: "./data/settings.json" }, { dir: BaseDirectory.AppData });
   }
}

/**
 * Creates a /data directory if it doesn't exists
 */
async function createDataDir() {
   if (!(await exists("data", { dir: BaseDirectory.AppData }))) {
      await createDir("data", { dir: BaseDirectory.AppData });
   }
}

function getDefaultSettings(): AppSettings {
   return { serverAddress: "localhost:3000" };
}
