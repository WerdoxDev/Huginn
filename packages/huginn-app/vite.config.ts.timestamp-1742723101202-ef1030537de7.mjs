// vite.config.ts
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { reactRouter } from "file:///E:/JS/huginn-monorepo/node_modules/@react-router/dev/dist/vite.js";
import autoprefixer from "file:///E:/JS/huginn-monorepo/node_modules/autoprefixer/lib/autoprefixer.js";
import { parseTOML } from "file:///E:/JS/huginn-monorepo/node_modules/confbox/dist/index.mjs";
import tailwindcss from "file:///E:/JS/huginn-monorepo/node_modules/tailwindcss/lib/index.js";
import AutoImport from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-auto-import/dist/vite.js";
import IconsResolver from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-icons/dist/resolver.js";
import Icons from "file:///E:/JS/huginn-monorepo/node_modules/unplugin-icons/dist/vite.js";
import { defineConfig } from "file:///E:/JS/huginn-monorepo/node_modules/vite/dist/node/index.js";
import babel from "file:///E:/JS/huginn-monorepo/node_modules/vite-plugin-babel/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\JS\\huginn-monorepo\\packages\\huginn-app";
var reactCompilerConfig = { target: "19" };
var vite_config_default = defineConfig({
  plugins: [
    // reactRouterDevTools(),
    reactRouter(),
    Icons({ compiler: "jsx" }),
    AutoImport({
      resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })]
      // dts: "./src/auto-imports.d.ts",
    }),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", reactCompilerConfig], "@babel/plugin-syntax-jsx"]
      }
    })
  ],
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(parseTOML(await readFile("src-tauri/Cargo.toml", "utf8")).package.version)
    // __APP_VERSION__: JSON.stringify((parseTOML(await Bun.file("src-tauri/Cargo.toml").text()) as CargoToml).package.version),
  },
  resolve: {
    alias: {
      "@": path.join(__vite_injected_original_dirname, "./src"),
      "@lib": path.join(__vite_injected_original_dirname, "./src/lib"),
      "@hooks": path.join(__vite_injected_original_dirname, "./src/hooks"),
      "@contexts": path.join(__vite_injected_original_dirname, "./src/contexts"),
      "@components": path.join(__vite_injected_original_dirname, "./src/components"),
      "@stores": path.join(__vite_injected_original_dirname, "./src/stores")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxKU1xcXFxodWdpbm4tbW9ub3JlcG9cXFxccGFja2FnZXNcXFxcaHVnaW5uLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcSlNcXFxcaHVnaW5uLW1vbm9yZXBvXFxcXHBhY2thZ2VzXFxcXGh1Z2lubi1hcHBcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0pTL2h1Z2lubi1tb25vcmVwby9wYWNrYWdlcy9odWdpbm4tYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tIFwibm9kZTpmcy9wcm9taXNlc1wiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcclxuaW1wb3J0IHsgcmVhY3RSb3V0ZXIgfSBmcm9tIFwiQHJlYWN0LXJvdXRlci9kZXYvdml0ZVwiO1xyXG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcclxuLy8gaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSBcIkB0YW5zdGFjay9yb3V0ZXItcGx1Z2luL3ZpdGVcIjtcclxuaW1wb3J0IHsgcGFyc2VUT01MIH0gZnJvbSBcImNvbmZib3hcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJ0YWlsd2luZGNzc1wiO1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tIFwidW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZVwiO1xyXG5pbXBvcnQgSWNvbnNSZXNvbHZlciBmcm9tIFwidW5wbHVnaW4taWNvbnMvcmVzb2x2ZXJcIjtcclxuaW1wb3J0IEljb25zIGZyb20gXCJ1bnBsdWdpbi1pY29ucy92aXRlXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBiYWJlbCBmcm9tIFwidml0ZS1wbHVnaW4tYmFiZWxcIjtcclxuXHJcbnR5cGUgQ2FyZ29Ub21sID0geyBwYWNrYWdlOiB7IHZlcnNpb246IHN0cmluZyB9IH07XHJcbmNvbnN0IHJlYWN0Q29tcGlsZXJDb25maWcgPSB7IHRhcmdldDogXCIxOVwiIH07XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG5cdHBsdWdpbnM6IFtcclxuXHRcdC8vIHJlYWN0Um91dGVyRGV2VG9vbHMoKSxcclxuXHRcdHJlYWN0Um91dGVyKCksXHJcblx0XHRJY29ucyh7IGNvbXBpbGVyOiBcImpzeFwiIH0pLFxyXG5cdFx0QXV0b0ltcG9ydCh7XHJcblx0XHRcdHJlc29sdmVyczogW0ljb25zUmVzb2x2ZXIoeyBwcmVmaXg6IFwiSWNvblwiLCBleHRlbnNpb246IFwianN4XCIgfSldLFxyXG5cdFx0XHQvLyBkdHM6IFwiLi9zcmMvYXV0by1pbXBvcnRzLmQudHNcIixcclxuXHRcdH0pLFxyXG5cdFx0YmFiZWwoe1xyXG5cdFx0XHRmaWx0ZXI6IC9cXC5banRdc3g/JC8sXHJcblx0XHRcdGJhYmVsQ29uZmlnOiB7XHJcblx0XHRcdFx0cHJlc2V0czogW1wiQGJhYmVsL3ByZXNldC10eXBlc2NyaXB0XCJdLFxyXG5cdFx0XHRcdHBsdWdpbnM6IFtbXCJiYWJlbC1wbHVnaW4tcmVhY3QtY29tcGlsZXJcIiwgcmVhY3RDb21waWxlckNvbmZpZ10sIFwiQGJhYmVsL3BsdWdpbi1zeW50YXgtanN4XCJdLFxyXG5cdFx0XHR9LFxyXG5cdFx0fSksXHJcblx0XSxcclxuXHJcblx0Y3NzOiB7XHJcblx0XHRwb3N0Y3NzOiB7XHJcblx0XHRcdHBsdWdpbnM6IFt0YWlsd2luZGNzcywgYXV0b3ByZWZpeGVyXSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHJcblx0ZGVmaW5lOiB7XHJcblx0XHRfX0FQUF9WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KChwYXJzZVRPTUwoYXdhaXQgcmVhZEZpbGUoXCJzcmMtdGF1cmkvQ2FyZ28udG9tbFwiLCBcInV0ZjhcIikpIGFzIENhcmdvVG9tbCkucGFja2FnZS52ZXJzaW9uKSxcclxuXHRcdC8vIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoKHBhcnNlVE9NTChhd2FpdCBCdW4uZmlsZShcInNyYy10YXVyaS9DYXJnby50b21sXCIpLnRleHQoKSkgYXMgQ2FyZ29Ub21sKS5wYWNrYWdlLnZlcnNpb24pLFxyXG5cdH0sXHJcblxyXG5cdHJlc29sdmU6IHtcclxuXHRcdGFsaWFzOiB7XHJcblx0XHRcdFwiQFwiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG5cdFx0XHRcIkBsaWJcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9saWJcIiksXHJcblx0XHRcdFwiQGhvb2tzXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvaG9va3NcIiksXHJcblx0XHRcdFwiQGNvbnRleHRzXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmMvY29udGV4dHNcIiksXHJcblx0XHRcdFwiQGNvbXBvbmVudHNcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9jb21wb25lbnRzXCIpLFxyXG5cdFx0XHRcIkBzdG9yZXNcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9zdG9yZXNcIiksXHJcblx0XHR9LFxyXG5cdH0sXHJcblx0Ly8gcHJldmVudCB2aXRlIGZyb20gb2JzY3VyaW5nIHJ1c3QgZXJyb3JzXHJcblx0Y2xlYXJTY3JlZW46IGZhbHNlLFxyXG5cdC8vIFRhdXJpIGV4cGVjdHMgYSBmaXhlZCBwb3J0LCBmYWlsIGlmIHRoYXQgcG9ydCBpcyBub3QgYXZhaWxhYmxlXHJcblx0c2VydmVyOiB7XHJcblx0XHRzdHJpY3RQb3J0OiB0cnVlLFxyXG5cdH0sXHJcblx0Ly8gdG8gYWNjZXNzIHRoZSBUYXVyaSBlbnZpcm9ubWVudCB2YXJpYWJsZXMgc2V0IGJ5IHRoZSBDTEkgd2l0aCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB0YXJnZXRcclxuXHRlbnZQcmVmaXg6IFtcIlZJVEVfXCIsIFwiVEFVUklfRU5WXypcIl0sXHJcblx0YnVpbGQ6IHtcclxuXHRcdC8vIFRhdXJpIHVzZXMgQ2hyb21pdW0gb24gV2luZG93cyBhbmQgV2ViS2l0IG9uIG1hY09TIGFuZCBMaW51eFxyXG5cdFx0dGFyZ2V0OiBcImVzbmV4dFwiLFxyXG5cdFx0Ly8gZG9uJ3QgbWluaWZ5IGZvciBkZWJ1ZyBidWlsZHNcclxuXHRcdG1pbmlmeTogIXByb2Nlc3MuZW52LlRBVVJJX0RFQlVHID8gXCJlc2J1aWxkXCIgOiBmYWxzZSxcclxuXHRcdC8vIHByb2R1Y2Ugc291cmNlbWFwcyBmb3IgZGVidWcgYnVpbGRzXHJcblx0XHRzb3VyY2VtYXA6ICEhcHJvY2Vzcy5lbnYuVEFVUklfREVCVUcsXHJcblx0fSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVQsU0FBUyxnQkFBZ0I7QUFDaFYsWUFBWSxVQUFVO0FBQ3RCLFNBQVMsbUJBQW1CO0FBQzVCLE9BQU8sa0JBQWtCO0FBRXpCLFNBQVMsaUJBQWlCO0FBQzFCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sV0FBVztBQUNsQixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFYbEIsSUFBTSxtQ0FBbUM7QUFjekMsSUFBTSxzQkFBc0IsRUFBRSxRQUFRLEtBQUs7QUFHM0MsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBO0FBQUEsSUFFUixZQUFZO0FBQUEsSUFDWixNQUFNLEVBQUUsVUFBVSxNQUFNLENBQUM7QUFBQSxJQUN6QixXQUFXO0FBQUEsTUFDVixXQUFXLENBQUMsY0FBYyxFQUFFLFFBQVEsUUFBUSxXQUFXLE1BQU0sQ0FBQyxDQUFDO0FBQUE7QUFBQSxJQUVoRSxDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsUUFDWixTQUFTLENBQUMsMEJBQTBCO0FBQUEsUUFDcEMsU0FBUyxDQUFDLENBQUMsK0JBQStCLG1CQUFtQixHQUFHLDBCQUEwQjtBQUFBLE1BQzNGO0FBQUEsSUFDRCxDQUFDO0FBQUEsRUFDRjtBQUFBLEVBRUEsS0FBSztBQUFBLElBQ0osU0FBUztBQUFBLE1BQ1IsU0FBUyxDQUFDLGFBQWEsWUFBWTtBQUFBLElBQ3BDO0FBQUEsRUFDRDtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ1AsaUJBQWlCLEtBQUssVUFBVyxVQUFVLE1BQU0sU0FBUyx3QkFBd0IsTUFBTSxDQUFDLEVBQWdCLFFBQVEsT0FBTztBQUFBO0FBQUEsRUFFekg7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLEtBQVUsVUFBSyxrQ0FBVyxPQUFPO0FBQUEsTUFDakMsUUFBYSxVQUFLLGtDQUFXLFdBQVc7QUFBQSxNQUN4QyxVQUFlLFVBQUssa0NBQVcsYUFBYTtBQUFBLE1BQzVDLGFBQWtCLFVBQUssa0NBQVcsZ0JBQWdCO0FBQUEsTUFDbEQsZUFBb0IsVUFBSyxrQ0FBVyxrQkFBa0I7QUFBQSxNQUN0RCxXQUFnQixVQUFLLGtDQUFXLGNBQWM7QUFBQSxJQUMvQztBQUFBLEVBQ0Q7QUFBQTtBQUFBLEVBRUEsYUFBYTtBQUFBO0FBQUEsRUFFYixRQUFRO0FBQUEsSUFDUCxZQUFZO0FBQUEsRUFDYjtBQUFBO0FBQUEsRUFFQSxXQUFXLENBQUMsU0FBUyxhQUFhO0FBQUEsRUFDbEMsT0FBTztBQUFBO0FBQUEsSUFFTixRQUFRO0FBQUE7QUFBQSxJQUVSLFFBQVEsQ0FBQyxRQUFRLElBQUksY0FBYyxZQUFZO0FBQUE7QUFBQSxJQUUvQyxXQUFXLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFBQSxFQUMxQjtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
