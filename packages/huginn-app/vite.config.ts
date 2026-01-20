import * as path from "node:path";
// import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { version } from "./package.json";

const reactCompilerConfig = { target: "19" };

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
   const isElectron = process.env.BUILD_TARGET === "electron";
   const base = isElectron ? "./" : "/app";
   return {
      base: "/app/",
      publicDir: "public",

      plugins: [
         // basicSsl(),
         // reactRouterDevTools(),
         tailwindcss(),
         react({
            jsxRuntime: "automatic",
            babel: {
               presets: ["@babel/preset-typescript"],
               plugins: [["babel-plugin-react-compiler", reactCompilerConfig], "@babel/plugin-syntax-jsx"],
            },
         }),
         Icons({ compiler: "jsx" }),
         AutoImport({
            resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
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
