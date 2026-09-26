import type { ThemeType } from "@huginnjs/shared";

import { mappedColorThemes, setCssColorVariables } from "@huginn/frontend-shared";
import { syncZustandStore } from "@lib/sync-zustand";
import { useStorage } from "@stores/storageStore";
import { createContext, type ReactNode, useLayoutEffect } from "react";
import { createStore, useStore } from "zustand";
import { combine } from "zustand/middleware";

const store = createStore(
   combine(
      {
         themeType: "pine-green" as ThemeType,
         theme: mappedColorThemes["pine-green"],
      },
      (set) => ({
         setTheme: (type: ThemeType) =>
            set(() => {
               const theme = mappedColorThemes[type];
               setCssColorVariables(theme);
               return { themeType: type, theme: theme };
            }),
      }),
   ),
);

const ThemeContext = createContext<typeof store>({} as typeof store);

export function ThemeProvider(props: { children?: ReactNode }) {
   const settings = useStorage("settings");

   useLayoutEffect(() => {
      store.getState().setTheme(settings.theme);
   }, [settings.theme]);

   return <ThemeContext.Provider value={store}>{props.children}</ThemeContext.Provider>;
}

export function useTheme() {
   return useStore(store);
}

export const themeStore = store;

syncZustandStore(store, { name: "themeStore", partialize: (state) => ({ themeType: state.themeType, theme: state.theme }) });
