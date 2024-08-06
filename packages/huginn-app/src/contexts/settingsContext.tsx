import { BaseDirectory, createDir, exists, readTextFile, writeFile } from "@tauri-apps/api/fs";
import { appDataDir } from "@tauri-apps/api/path";
import { Dispatch, ReactNode, createContext, useContext, useReducer } from "react";
import { DeepPartial, ThemeType } from "@/types";

export type SettingsContextType = {
   serverAddress: string;
   theme: ThemeType;
};

// const defaultValue: SettingsContextType = { serverAddress: "localhost:3000", theme: "pine green" };
const defaultValue: SettingsContextType = { serverAddress: "https://huginn-b4yw.onrender.com", theme: "pine green" };

let value = defaultValue;
if (window.__TAURI__) {
   await tryCreateSettingsFile();
   value = JSON.parse(await readTextFile("./data/settings.json", { dir: BaseDirectory.AppData }));
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

   writeSettingsFile({ ...settings, ...action });

   return { ...settings, ...action };
}

async function writeSettingsFile(settings: SettingsContextType) {
   try {
      await writeFile({ path: "./data/settings.json", contents: JSON.stringify(settings, null, 2) }, { dir: BaseDirectory.AppData });
   } catch (e) {
      console.error(e);
   }
}

async function tryCreateSettingsFile() {
   try {
      const directory = await appDataDir();
      if (!(await exists(directory))) {
         await createDir(directory);
      }

      if (!(await exists("data", { dir: BaseDirectory.AppData }))) {
         await createDir("data", { dir: BaseDirectory.AppData });
      }

      if (!(await exists("data/settings.json", { dir: BaseDirectory.AppData }))) {
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
