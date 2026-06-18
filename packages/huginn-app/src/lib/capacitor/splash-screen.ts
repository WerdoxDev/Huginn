import { registerPlugin } from "@capacitor/core";

export type SplashScreenPlugin = {
   hide: () => Promise<void>;
};

export const SplashScreen = registerPlugin<SplashScreenPlugin>("SplashScreen", {
   web: () => ({
      hide: async () => {},
   }),
});
