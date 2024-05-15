import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";
import AutoImport from "unplugin-auto-import/vite";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [
      react(),
      tsconfigPaths({ projects: ["./", "../huginn-api", "../huginn-shared"] }),
      TanStackRouterVite(),
      Icons({ compiler: "jsx" }),
      AutoImport({
         resolvers: [
            IconsResolver({
               prefix: "Icon",
               extension: "jsx",
            }),
         ],
      }),
   ],
   // prevent vite from obscuring rust errors
   clearScreen: false,
   // Tauri expects a fixed port, fail if that port is not available
   server: {
      strictPort: true,
   },
   // to access the Tauri environment variables set by the CLI with information about the current target
   envPrefix: [
      "VITE_",
      "TAURI_PLATFORM",
      "TAURI_ARCH",
      "TAURI_FAMILY",
      "TAURI_PLATFORM_VERSION",
      "TAURI_PLATFORM_TYPE",
      "TAURI_DEBUG",
   ],
   build: {
      // Tauri uses Chromium on Windows and WebKit on macOS and Linux
      target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
      // don't minify for debug builds
      minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
      // produce sourcemaps for debug builds
      sourcemap: !!process.env.TAURI_DEBUG,
   },
});
