// vite.config.ts
import * as path from "node:path";
import { TanStackRouterVite } from "file:///E:/JS/huginn-monorepo/node_modules/@tanstack/router-vite-plugin/dist/esm/index.js";
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
    TanStackRouterVite(),
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
  envPrefix: ["VITE_", "TAURI_PLATFORM", "TAURI_ARCH", "TAURI_FAMILY", "TAURI_PLATFORM_VERSION", "TAURI_PLATFORM_TYPE", "TAURI_DEBUG"],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxKU1xcXFxodWdpbm4tbW9ub3JlcG9cXFxccGFja2FnZXNcXFxcaHVnaW5uLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcSlNcXFxcaHVnaW5uLW1vbm9yZXBvXFxcXHBhY2thZ2VzXFxcXGh1Z2lubi1hcHBcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0pTL2h1Z2lubi1tb25vcmVwby9wYWNrYWdlcy9odWdpbm4tYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0ICogYXMgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XHJcbmltcG9ydCB7IFRhblN0YWNrUm91dGVyVml0ZSB9IGZyb20gXCJAdGFuc3RhY2svcm91dGVyLXZpdGUtcGx1Z2luXCI7XHJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI7XHJcbmltcG9ydCB7IHBhcnNlVE9NTCB9IGZyb20gXCJjb25mYm94XCI7XHJcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gXCJ1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlXCI7XHJcbmltcG9ydCBJY29uc1Jlc29sdmVyIGZyb20gXCJ1bnBsdWdpbi1pY29ucy9yZXNvbHZlclwiO1xyXG5pbXBvcnQgSWNvbnMgZnJvbSBcInVucGx1Z2luLWljb25zL3ZpdGVcIjtcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuXHJcbnR5cGUgQ2FyZ29Ub21sID0geyBwYWNrYWdlOiB7IHZlcnNpb246IHN0cmluZyB9IH07XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG5cdHBsdWdpbnM6IFtcclxuXHRcdHJlYWN0KHsgZGV2VGFyZ2V0OiBcImVzbmV4dFwiIH0pLFxyXG5cdFx0VGFuU3RhY2tSb3V0ZXJWaXRlKCksXHJcblx0XHRJY29ucyh7IGNvbXBpbGVyOiBcImpzeFwiLCBqc3g6IFwicmVhY3RcIiB9KSxcclxuXHRcdEF1dG9JbXBvcnQoe1xyXG5cdFx0XHRpbXBvcnRzOiBbXCJyZWFjdFwiXSxcclxuXHRcdFx0cmVzb2x2ZXJzOiBbSWNvbnNSZXNvbHZlcih7IHByZWZpeDogXCJJY29uXCIsIGV4dGVuc2lvbjogXCJqc3hcIiB9KV0sXHJcblx0XHRcdGRpcnM6IFtcIi4vc3JjLyoqXCIsIFwiIXNyYy9yb3V0ZXMvKipcIl0sXHJcblx0XHRcdGR0czogXCIuL3NyYy9hdXRvLWltcG9ydHMuZC50c1wiLFxyXG5cdFx0fSksXHJcblx0XSxcclxuXHJcblx0ZGVmaW5lOiB7XHJcblx0XHRfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KChwYXJzZVRPTUwoYXdhaXQgQnVuLmZpbGUoXCJzcmMtdGF1cmkvQ2FyZ28udG9tbFwiKS50ZXh0KCkpIGFzIENhcmdvVG9tbCkucGFja2FnZS52ZXJzaW9uKSxcclxuXHR9LFxyXG5cclxuXHRyZXNvbHZlOiB7XHJcblx0XHRhbGlhczoge1xyXG5cdFx0XHRcIkBcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuXHRcdFx0XCJAbGliXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvbGliXCIpLFxyXG5cdFx0XHRcIkBob29rc1wiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjL2hvb2tzXCIpLFxyXG5cdFx0XHRcIkBjb250ZXh0c1wiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjL2NvbnRleHRzXCIpLFxyXG5cdFx0XHRcIkBjb21wb25lbnRzXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvY29tcG9uZW50c1wiKSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHQvLyBwcmV2ZW50IHZpdGUgZnJvbSBvYnNjdXJpbmcgcnVzdCBlcnJvcnNcclxuXHRjbGVhclNjcmVlbjogZmFsc2UsXHJcblx0Ly8gVGF1cmkgZXhwZWN0cyBhIGZpeGVkIHBvcnQsIGZhaWwgaWYgdGhhdCBwb3J0IGlzIG5vdCBhdmFpbGFibGVcclxuXHRzZXJ2ZXI6IHtcclxuXHRcdHN0cmljdFBvcnQ6IHRydWUsXHJcblx0fSxcclxuXHQvLyB0byBhY2Nlc3MgdGhlIFRhdXJpIGVudmlyb25tZW50IHZhcmlhYmxlcyBzZXQgYnkgdGhlIENMSSB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHRhcmdldFxyXG5cdGVudlByZWZpeDogW1wiVklURV9cIiwgXCJUQVVSSV9QTEFURk9STVwiLCBcIlRBVVJJX0FSQ0hcIiwgXCJUQVVSSV9GQU1JTFlcIiwgXCJUQVVSSV9QTEFURk9STV9WRVJTSU9OXCIsIFwiVEFVUklfUExBVEZPUk1fVFlQRVwiLCBcIlRBVVJJX0RFQlVHXCJdLFxyXG5cdGJ1aWxkOiB7XHJcblx0XHQvLyBUYXVyaSB1c2VzIENocm9taXVtIG9uIFdpbmRvd3MgYW5kIFdlYktpdCBvbiBtYWNPUyBhbmQgTGludXhcclxuXHRcdHRhcmdldDogXCJlc25leHRcIixcclxuXHRcdC8vIGRvbid0IG1pbmlmeSBmb3IgZGVidWcgYnVpbGRzXHJcblx0XHRtaW5pZnk6ICFwcm9jZXNzLmVudi5UQVVSSV9ERUJVRyA/IFwiZXNidWlsZFwiIDogZmFsc2UsXHJcblx0XHQvLyBwcm9kdWNlIHNvdXJjZW1hcHMgZm9yIGRlYnVnIGJ1aWxkc1xyXG5cdFx0c291cmNlbWFwOiAhIXByb2Nlc3MuZW52LlRBVVJJX0RFQlVHLFxyXG5cdH0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVULFlBQVksVUFBVTtBQUM3VSxTQUFTLDBCQUEwQjtBQUNuQyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxpQkFBaUI7QUFDMUIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBUDdCLElBQU0sbUNBQW1DO0FBWXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLE1BQU0sRUFBRSxXQUFXLFNBQVMsQ0FBQztBQUFBLElBQzdCLG1CQUFtQjtBQUFBLElBQ25CLE1BQU0sRUFBRSxVQUFVLE9BQU8sS0FBSyxRQUFRLENBQUM7QUFBQSxJQUN2QyxXQUFXO0FBQUEsTUFDVixTQUFTLENBQUMsT0FBTztBQUFBLE1BQ2pCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsUUFBUSxRQUFRLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxNQUMvRCxNQUFNLENBQUMsWUFBWSxnQkFBZ0I7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDTixDQUFDO0FBQUEsRUFDRjtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ1AsaUJBQWlCLEtBQUssVUFBVyxVQUFVLE1BQU0sSUFBSSxLQUFLLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxFQUFnQixRQUFRLE9BQU87QUFBQSxFQUN4SDtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ04sS0FBVSxVQUFLLGtDQUFXLE9BQU87QUFBQSxNQUNqQyxRQUFhLFVBQUssa0NBQVcsV0FBVztBQUFBLE1BQ3hDLFVBQWUsVUFBSyxrQ0FBVyxhQUFhO0FBQUEsTUFDNUMsYUFBa0IsVUFBSyxrQ0FBVyxnQkFBZ0I7QUFBQSxNQUNsRCxlQUFvQixVQUFLLGtDQUFXLGtCQUFrQjtBQUFBLElBQ3ZEO0FBQUEsRUFDRDtBQUFBO0FBQUEsRUFFQSxhQUFhO0FBQUE7QUFBQSxFQUViLFFBQVE7QUFBQSxJQUNQLFlBQVk7QUFBQSxFQUNiO0FBQUE7QUFBQSxFQUVBLFdBQVcsQ0FBQyxTQUFTLGtCQUFrQixjQUFjLGdCQUFnQiwwQkFBMEIsdUJBQXVCLGFBQWE7QUFBQSxFQUNuSSxPQUFPO0FBQUE7QUFBQSxJQUVOLFFBQVE7QUFBQTtBQUFBLElBRVIsUUFBUSxDQUFDLFFBQVEsSUFBSSxjQUFjLFlBQVk7QUFBQTtBQUFBLElBRS9DLFdBQVcsQ0FBQyxDQUFDLFFBQVEsSUFBSTtBQUFBLEVBQzFCO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
