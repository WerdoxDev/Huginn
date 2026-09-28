import type { ThemeType } from "@huginnjs/shared";

import { mappedColorThemes, setCssColorVariables } from "@huginn/frontend-shared";
import { _useStore, createStore, useSelector } from "@tanstack/react-store";

export const themeStore = createStore({ themeType: "pine-green" as ThemeType, theme: mappedColorThemes["pine-green"] }, ({ setState }) => ({
   setTheme: (type: ThemeType) => {
      localStorage.setItem("theme", type);
      const theme = mappedColorThemes[type];
      setCssColorVariables(theme);
      return setState((prev) => ({ ...prev, themeType: type, theme }));
   },
}));

export function useTheme() {
   return useSelector(themeStore, (state) => state);
}
