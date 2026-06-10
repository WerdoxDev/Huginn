import posthog from "@posthog/rollup-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import * as fs from "node:fs";
import * as path from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import { version } from "./package.json";

const reactCompilerConfig = { target: "19" };

const isHttps = process.env.VITE_LAN_HTTPS === "true";

const keyFile = isHttps ? fs.readFileSync("./certs/key.pem") : undefined;
const certFile = isHttps ? fs.readFileSync("./certs/cert.pem") : undefined;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
   const isElectron = mode === "electron";
   const isElectronDev = mode === "electron-dev";
   const isCapacitor = mode === "capacitor";
   const shouldUploadSourcemaps = process.env.VERCEL === "1" || process.env.CI === "true";
   const isVercelPreview = process.env.VERCEL_ENV === "preview";
   // const isVercelPreview = process.env.VERCEL === "1";
   const base = isVercelPreview ? "/" : isElectron ? "./" : isCapacitor ? "/" : "/app";
   return {
      base,

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
         posthog({
            personalApiKey: process.env.POSTHOG_CLI_API_KEY!,
            projectId: process.env.POSTHOG_PROJECT_ID,
            host: "https://eu.posthog.com",
            sourcemaps: {
               enabled: shouldUploadSourcemaps,
               releaseName: "huginn-app",
               releaseVersion: isVercelPreview ? process.env.VERCEL_GITHUB_COMMIT_SHA : version.toString(),
            },
         }),
      ],
      server: {
         https: isHttps
            ? {
                 key: keyFile,
                 cert: certFile,
              }
            : undefined,
      },

      define: {
         __APP_VERSION__: JSON.stringify(version.toString()),
         __IS_ELECTRON__: JSON.stringify(isElectron || isElectronDev),
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
         // sourcemap: true,
         target: "esnext",
         outDir: "./dist",
      },
   };
});
