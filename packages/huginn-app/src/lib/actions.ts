import { storageStore } from "@stores/storageStore";
import * as semver from "semver-ts";

import { storageDefaults } from "../../shared/storage-defaults";

export type ActionType = "reset_settings_advanced_presets" | "reset_settings_theme";
type Action = {
   version: string;
   action: ActionType;
};

export const pendingActions: Action[] = [
   { version: "0.72.0", action: "reset_settings_advanced_presets" },
   { version: "0.78.0", action: "reset_settings_theme" },
];

export const actions: Record<ActionType, () => void | Promise<void>> = {
   reset_settings_advanced_presets: async () => {
      const store = storageStore.getState();
      const settings = await store.getValue("settings");

      const defaultSettings = { ...storageDefaults.settings };

      settings.hostnamePresets = defaultSettings.hostnamePresets;
      settings.activePresetName = defaultSettings.activePresetName;

      await store.setValue("settings", settings);
   },
   reset_settings_theme: async () => {
      const store = storageStore.getState();
      const settings = await store.getValue("settings");

      const defaultSettings = { ...storageDefaults.settings };

      settings.theme = defaultSettings.theme;
      await store.setValue("settings", settings);
   },
};

export async function runPendingActions() {
   const store = storageStore.getState();
   const clientInfo = await store.getValue("client-info");

   // this is already the latest version of the app freshly installed
   if (!clientInfo.lastVersion) return;

   const pending = pendingActions.filter((a) => {
      const currentVersion = __APP_VERSION__;
      return semver.gt(a.version, clientInfo.lastVersion ?? "0.0.0") && semver.lte(a.version, currentVersion);
   });

   console.log("Pending actions to run:", pending);

   for (const action of pending) {
      console.log(`Running pending action: ${action.action} for version ${action.version}`);
      const runAction = actions[action.action];
      await runAction();
   }
}
