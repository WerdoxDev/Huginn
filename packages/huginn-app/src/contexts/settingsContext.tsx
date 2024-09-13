import { DeepPartial, ThemeType } from "@/types";
import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";
import { Dispatch, ReactNode, createContext, useContext, useReducer } from "react";

export type SettingsContextType = {
   serverAddress: string;
   cdnAddress: string;
   theme: ThemeType;
};

const defaultValue: SettingsContextType = {
   serverAddress: "https://asgard.huginn.dev",
   cdnAddress: "https://asgard.huginn.dev",
   theme: "pine green",
};
// const defaultValue: SettingsContextType = { serverAddress: "https://huginn-b4yw.onrender.com", theme: "pine green" };

let value = defaultValue;
if (window.__TAURI_INTERNALS__) {
   await tryCreateSettingsFile();
   value = { ...defaultValue, ...JSON.parse(await readTextFile("./data/settings.json", { baseDir: BaseDirectory.AppData })) };
} else {
   if (!localStorage.getItem("settings")) {
      localStorage.setItem("settings", JSON.stringify(defaultValue));
   }

   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
   value = { ...defaultValue, ...JSON.parse(localStorage.getItem("settings")!) };
}

const SettingsContext = createContext<SettingsContextType>(value);
const SettingsDispatchContext = createContext<Dispatch<DeepPartial<SettingsContextType>>>(() => {});

export function SettingsProvider(props: { children?: ReactNode }) {
   const [settings, dispatch] = useReducer(settingsReducer, value);

   return (
      <SettingsContext.Provider value={settings}>
         <SettingsDispatchContext.Provider value={dispatch}>{props.children}</SettingsDispatchContext.Provider>
      </SettingsContext.Provider>
   );
}

function settingsReducer(settings: SettingsContextType, action: DeepPartial<SettingsContextType>) {
   if (!action) return { ...settings };

   if (window.__TAURI_INTERNALS__) {
      writeSettingsFile({ ...settings, ...action });
   } else {
      localStorage.setItem("settings", JSON.stringify({ ...settings, ...action }));
   }

   return { ...settings, ...action };
}

async function writeSettingsFile(settings: SettingsContextType) {
   try {
      await writeTextFile("./data/settings.json", JSON.stringify(settings, null, 2), { baseDir: BaseDirectory.AppData });
   } catch (e) {
      console.error(e);
   }
}

async function tryCreateSettingsFile() {
   try {
      const directory = await appDataDir();
      if (!(await exists(directory))) {
         await create(directory);
      }

      if (!(await exists("data", { baseDir: BaseDirectory.AppData }))) {
         await create("data", { baseDir: BaseDirectory.AppData });
      }

      if (!(await exists("data/settings.json", { baseDir: BaseDirectory.AppData }))) {
         await writeSettingsFile(defaultValue);
      }
   } catch (e) {
      console.error(e);
   }
}

export function useSettings() {
   return useContext(SettingsContext);
}

export function useSettingsDispatcher() {
   return useContext(SettingsDispatchContext);
}
