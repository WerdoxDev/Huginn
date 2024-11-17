// vite.config.ts
import * as path from "node:path";
import { reactRouter } from "file:///E:/JS/huginn-monorepo/node_modules/@react-router/dev/dist/vite.js";
import react from "file:///E:/JS/huginn-monorepo/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { parseTOML } from "file:///E:/JS/huginn-monorepo/node_modules/confbox/dist/index.mjs";
import AutoImport from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-auto-import/dist/vite.js";
import IconsResolver from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-icons/dist/resolver.js";
import Icons from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-icons/dist/vite.js";
import { defineConfig } from "file:///E:/JS/huginn-monorepo/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "E:\\JS\\huginn-monorepo\\packages\\huginn-app";
var vite_config_default = defineConfig({
  plugins: [
    react({ devTarget: "esnext" }),
    reactRouter({
      appDirectory: "src",
      // Server-side render by default, to enable SPA mode set this to `false`
      ssr: false
    }),
    Icons({ compiler: "jsx", jsx: "react" }),
    AutoImport({
      imports: ["react"],
      resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
      dirs: ["./src/**", "!src/routes/**"],
      dts: "./src/auto-imports.d.ts"
    })
  ],
  define: {
    __APP_VERSION__: JSON.stringify(parseTOML(await Bun.file("src-tauri/Cargo.toml").text()).package.version)
  },
  resolve: {
    alias: {
      "@": path.join(__vite_injected_original_dirname, "./src"),
      "@lib": path.join(__vite_injected_original_dirname, "./src/lib"),
      "@hooks": path.join(__vite_injected_original_dirname, "./src/hooks"),
      "@contexts": path.join(__vite_injected_original_dirname, "./src/contexts"),
      "@components": path.join(__vite_injected_original_dirname, "./src/components")
    }
  },
  // prevent vite from obscuring rust errors
  clearScreen: false,
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    strictPort: true
  },
  // to access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: "esnext",
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxKU1xcXFxodWdpbm4tbW9ub3JlcG9cXFxccGFja2FnZXNcXFxcaHVnaW5uLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcSlNcXFxcaHVnaW5uLW1vbm9yZXBvXFxcXHBhY2thZ2VzXFxcXGh1Z2lubi1hcHBcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0pTL2h1Z2lubi1tb25vcmVwby9wYWNrYWdlcy9odWdpbm4tYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0ICogYXMgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XHJcbmltcG9ydCB7IHJlYWN0Um91dGVyIH0gZnJvbSBcIkByZWFjdC1yb3V0ZXIvZGV2L3ZpdGVcIjtcclxuLy8gaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSBcIkB0YW5zdGFjay9yb3V0ZXItcGx1Z2luL3ZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHsgcGFyc2VUT01MIH0gZnJvbSBcImNvbmZib3hcIjtcclxuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSBcInVucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGVcIjtcclxuaW1wb3J0IEljb25zUmVzb2x2ZXIgZnJvbSBcInVucGx1Z2luLWljb25zL3Jlc29sdmVyXCI7XHJcbmltcG9ydCBJY29ucyBmcm9tIFwidW5wbHVnaW4taWNvbnMvdml0ZVwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5cclxudHlwZSBDYXJnb1RvbWwgPSB7IHBhY2thZ2U6IHsgdmVyc2lvbjogc3RyaW5nIH0gfTtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcblx0cGx1Z2luczogW1xyXG5cdFx0cmVhY3QoeyBkZXZUYXJnZXQ6IFwiZXNuZXh0XCIgfSksXHJcblx0XHRyZWFjdFJvdXRlcih7XHJcblx0XHRcdGFwcERpcmVjdG9yeTogXCJzcmNcIixcclxuXHRcdFx0Ly8gU2VydmVyLXNpZGUgcmVuZGVyIGJ5IGRlZmF1bHQsIHRvIGVuYWJsZSBTUEEgbW9kZSBzZXQgdGhpcyB0byBgZmFsc2VgXHJcblx0XHRcdHNzcjogZmFsc2UsXHJcblx0XHR9KSxcclxuXHRcdEljb25zKHsgY29tcGlsZXI6IFwianN4XCIsIGpzeDogXCJyZWFjdFwiIH0pLFxyXG5cdFx0QXV0b0ltcG9ydCh7XHJcblx0XHRcdGltcG9ydHM6IFtcInJlYWN0XCJdLFxyXG5cdFx0XHRyZXNvbHZlcnM6IFtJY29uc1Jlc29sdmVyKHsgcHJlZml4OiBcIkljb25cIiwgZXh0ZW5zaW9uOiBcImpzeFwiIH0pXSxcclxuXHRcdFx0ZGlyczogW1wiLi9zcmMvKipcIiwgXCIhc3JjL3JvdXRlcy8qKlwiXSxcclxuXHRcdFx0ZHRzOiBcIi4vc3JjL2F1dG8taW1wb3J0cy5kLnRzXCIsXHJcblx0XHR9KSxcclxuXHRdLFxyXG5cclxuXHRkZWZpbmU6IHtcclxuXHRcdF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoKHBhcnNlVE9NTChhd2FpdCBCdW4uZmlsZShcInNyYy10YXVyaS9DYXJnby50b21sXCIpLnRleHQoKSkgYXMgQ2FyZ29Ub21sKS5wYWNrYWdlLnZlcnNpb24pLFxyXG5cdH0sXHJcblxyXG5cdHJlc29sdmU6IHtcclxuXHRcdGFsaWFzOiB7XHJcblx0XHRcdFwiQFwiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG5cdFx0XHRcIkBsaWJcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9saWJcIiksXHJcblx0XHRcdFwiQGhvb2tzXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvaG9va3NcIiksXHJcblx0XHRcdFwiQGNvbnRleHRzXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvY29udGV4dHNcIiksXHJcblx0XHRcdFwiQGNvbXBvbmVudHNcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9jb21wb25lbnRzXCIpLFxyXG5cdFx0fSxcclxuXHR9LFxyXG5cdC8vIHByZXZlbnQgdml0ZSBmcm9tIG9ic2N1cmluZyBydXN0IGVycm9yc1xyXG5cdGNsZWFyU2NyZWVuOiBmYWxzZSxcclxuXHQvLyBUYXVyaSBleHBlY3RzIGEgZml4ZWQgcG9ydCwgZmFpbCBpZiB0aGF0IHBvcnQgaXMgbm90IGF2YWlsYWJsZVxyXG5cdHNlcnZlcjoge1xyXG5cdFx0c3RyaWN0UG9ydDogdHJ1ZSxcclxuXHR9LFxyXG5cdC8vIHRvIGFjY2VzcyB0aGUgVGF1cmkgZW52aXJvbm1lbnQgdmFyaWFibGVzIHNldCBieSB0aGUgQ0xJIHdpdGggaW5mb3JtYXRpb24gYWJvdXQgdGhlIGN1cnJlbnQgdGFyZ2V0XHJcblx0ZW52UHJlZml4OiBbXCJWSVRFX1wiLCBcIlRBVVJJX0VOVl8qXCJdLFxyXG5cdGJ1aWxkOiB7XHJcblx0XHQvLyBUYXVyaSB1c2VzIENocm9taXVtIG9uIFdpbmRvd3MgYW5kIFdlYktpdCBvbiBtYWNPUyBhbmQgTGludXhcclxuXHRcdHRhcmdldDogXCJlc25leHRcIixcclxuXHRcdC8vIGRvbid0IG1pbmlmeSBmb3IgZGVidWcgYnVpbGRzXHJcblx0XHRtaW5pZnk6ICFwcm9jZXNzLmVudi5UQVVSSV9ERUJVRyA/IFwiZXNidWlsZFwiIDogZmFsc2UsXHJcblx0XHQvLyBwcm9kdWNlIHNvdXJjZW1hcHMgZm9yIGRlYnVnIGJ1aWxkc1xyXG5cdFx0c291cmNlbWFwOiAhIXByb2Nlc3MuZW52LlRBVVJJX0RFQlVHLFxyXG5cdH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVULFlBQVksVUFBVTtBQUM3VSxTQUFTLG1CQUFtQjtBQUU1QixPQUFPLFdBQVc7QUFDbEIsU0FBUyxpQkFBaUI7QUFDMUIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBUjdCLElBQU0sbUNBQW1DO0FBYXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLE1BQU0sRUFBRSxXQUFXLFNBQVMsQ0FBQztBQUFBLElBQzdCLFlBQVk7QUFBQSxNQUNYLGNBQWM7QUFBQTtBQUFBLE1BRWQsS0FBSztBQUFBLElBQ04sQ0FBQztBQUFBLElBQ0QsTUFBTSxFQUFFLFVBQVUsT0FBTyxLQUFLLFFBQVEsQ0FBQztBQUFBLElBQ3ZDLFdBQVc7QUFBQSxNQUNWLFNBQVMsQ0FBQyxPQUFPO0FBQUEsTUFDakIsV0FBVyxDQUFDLGNBQWMsRUFBRSxRQUFRLFFBQVEsV0FBVyxNQUFNLENBQUMsQ0FBQztBQUFBLE1BQy9ELE1BQU0sQ0FBQyxZQUFZLGdCQUFnQjtBQUFBLE1BQ25DLEtBQUs7QUFBQSxJQUNOLENBQUM7QUFBQSxFQUNGO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDUCxpQkFBaUIsS0FBSyxVQUFXLFVBQVUsTUFBTSxJQUFJLEtBQUssc0JBQXNCLEVBQUUsS0FBSyxDQUFDLEVBQWdCLFFBQVEsT0FBTztBQUFBLEVBQ3hIO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUixPQUFPO0FBQUEsTUFDTixLQUFVLFVBQUssa0NBQVcsT0FBTztBQUFBLE1BQ2pDLFFBQWEsVUFBSyxrQ0FBVyxXQUFXO0FBQUEsTUFDeEMsVUFBZSxVQUFLLGtDQUFXLGFBQWE7QUFBQSxNQUM1QyxhQUFrQixVQUFLLGtDQUFXLGdCQUFnQjtBQUFBLE1BQ2xELGVBQW9CLFVBQUssa0NBQVcsa0JBQWtCO0FBQUEsSUFDdkQ7QUFBQSxFQUNEO0FBQUE7QUFBQSxFQUVBLGFBQWE7QUFBQTtBQUFBLEVBRWIsUUFBUTtBQUFBLElBQ1AsWUFBWTtBQUFBLEVBQ2I7QUFBQTtBQUFBLEVBRUEsV0FBVyxDQUFDLFNBQVMsYUFBYTtBQUFBLEVBQ2xDLE9BQU87QUFBQTtBQUFBLElBRU4sUUFBUTtBQUFBO0FBQUEsSUFFUixRQUFRLENBQUMsUUFBUSxJQUFJLGNBQWMsWUFBWTtBQUFBO0FBQUEsSUFFL0MsV0FBVyxDQUFDLENBQUMsUUFBUSxJQUFJO0FBQUEsRUFDMUI7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
