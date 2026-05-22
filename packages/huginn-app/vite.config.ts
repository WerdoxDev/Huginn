import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import * as path from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { version } from "./package.json";

const reactCompilerConfig = { target: "19" };

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
   const isElectron = mode === "electron";
   const base = isElectron ? "./" : "/app";
   return {
      base: base,
      publicDir: "public",
      // optimizeDeps: ["@huginn/shared"],
      plugins: [
         // basicSsl({ domains: ["192.168.178.21"] }),
         // reactRouterDevTools(),
         tanstackRouter({ target: "react", autoCodeSplitting: true }),
         react({ jsxRuntime: "automatic" }),
         babel({
            presets: ["@babel/preset-typescript"],
            plugins: [["babel-plugin-react-compiler", reactCompilerConfig], "@babel/plugin-syntax-jsx"],
         }),
         tailwindcss(),
         Icons({ compiler: "jsx" }),
         AutoImport({
            resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
            include: [/\.[jt]sx?$/, /tsr-split/],
         }),
         VitePWA({
            strategies: "injectManifest",
            srcDir: "src",
            filename: "sw.ts",
            registerType: "autoUpdate",
            injectRegister: false,

            pwaAssets: {
               disabled: false,
               config: true,
            },
            workbox: {
               maximumFileSizeToCacheInBytes: 4194304,
               globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
               globIgnores: ["**/electron/**"],
               cleanupOutdatedCaches: true,
               clientsClaim: true,
            },
            injectManifest: {
               maximumFileSizeToCacheInBytes: 4194304,
               globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
               globIgnores: ["**/electron/**"],
            },
            manifest: {
               name: "Huginn",
               short_name: "Huginn",
               theme_color: "#EBEBD3",
               background_color: "#EBEBD3",
            },
            devOptions: {
               enabled: false,
               navigateFallback: "index.html",
               suppressWarnings: true,
               type: "module",
            },
         }),
      ],

      define: {
         __APP_VERSION__: JSON.stringify(version.toString()),
         __IS_ELECTRON__: JSON.stringify(isElectron),
      },

      resolve: {
         alias: {
            "@": path.join(__dirname, "./src"),
            "@lib": path.join(__dirname, "./src/lib"),
            "@hooks": path.join(__dirname, "./src/hooks"),
            "@contexts": path.join(__dirname, "./src/contexts"),
            "@components": path.join(__dirname, "./src/components"),
            "@stores": path.join(__dirname, "./src/stores"),
         },
      },
      clearScreen: false,
      build: {
         target: "esnext",
         outDir: "./dist",
      },
   };
});
