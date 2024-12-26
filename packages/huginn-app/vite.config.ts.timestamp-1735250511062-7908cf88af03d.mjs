// vite.config.ts
import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { reactRouter } from "file:///E:/JS/huginn-monorepo/node_modules/@react-router/dev/dist/vite.js";
import autoprefixer from "file:///E:/JS/huginn-monorepo/node_modules/autoprefixer/lib/autoprefixer.js";
import { parseTOML } from "file:///E:/JS/huginn-monorepo/node_modules/confbox/dist/index.mjs";
import "file:///E:/JS/huginn-monorepo/node_modules/react-router-devtools/dist/index.js";
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
    Icons({ compiler: "jsx", jsx: "react" }),
    AutoImport({
      imports: ["react"],
      resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
      dirs: ["./src/**", "!src/routes/**"],
      dts: "./src/auto-imports.d.ts"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxKU1xcXFxodWdpbm4tbW9ub3JlcG9cXFxccGFja2FnZXNcXFxcaHVnaW5uLWFwcFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcSlNcXFxcaHVnaW5uLW1vbm9yZXBvXFxcXHBhY2thZ2VzXFxcXGh1Z2lubi1hcHBcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0pTL2h1Z2lubi1tb25vcmVwby9wYWNrYWdlcy9odWdpbm4tYXBwL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVhZEZpbGUgfSBmcm9tIFwibm9kZTpmcy9wcm9taXNlc1wiO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJub2RlOnBhdGhcIjtcclxuaW1wb3J0IHsgcmVhY3RSb3V0ZXIgfSBmcm9tIFwiQHJlYWN0LXJvdXRlci9kZXYvdml0ZVwiO1xyXG5pbXBvcnQgYXV0b3ByZWZpeGVyIGZyb20gXCJhdXRvcHJlZml4ZXJcIjtcclxuLy8gaW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSBcIkB0YW5zdGFjay9yb3V0ZXItcGx1Z2luL3ZpdGVcIjtcclxuaW1wb3J0IHsgcGFyc2VUT01MIH0gZnJvbSBcImNvbmZib3hcIjtcclxuaW1wb3J0IHsgcmVhY3RSb3V0ZXJEZXZUb29scyB9IGZyb20gXCJyZWFjdC1yb3V0ZXItZGV2dG9vbHNcIjtcclxuaW1wb3J0IHRhaWx3aW5kY3NzIGZyb20gXCJ0YWlsd2luZGNzc1wiO1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tIFwidW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZVwiO1xyXG5pbXBvcnQgSWNvbnNSZXNvbHZlciBmcm9tIFwidW5wbHVnaW4taWNvbnMvcmVzb2x2ZXJcIjtcclxuaW1wb3J0IEljb25zIGZyb20gXCJ1bnBsdWdpbi1pY29ucy92aXRlXCI7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCBiYWJlbCBmcm9tIFwidml0ZS1wbHVnaW4tYmFiZWxcIjtcclxuXHJcbnR5cGUgQ2FyZ29Ub21sID0geyBwYWNrYWdlOiB7IHZlcnNpb246IHN0cmluZyB9IH07XHJcbmNvbnN0IHJlYWN0Q29tcGlsZXJDb25maWcgPSB7IHRhcmdldDogXCIxOVwiIH07XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG5cdHBsdWdpbnM6IFtcclxuXHRcdC8vIHJlYWN0Um91dGVyRGV2VG9vbHMoKSxcclxuXHRcdHJlYWN0Um91dGVyKCksXHJcblx0XHRJY29ucyh7IGNvbXBpbGVyOiBcImpzeFwiLCBqc3g6IFwicmVhY3RcIiB9KSxcclxuXHRcdEF1dG9JbXBvcnQoe1xyXG5cdFx0XHRpbXBvcnRzOiBbXCJyZWFjdFwiXSxcclxuXHRcdFx0cmVzb2x2ZXJzOiBbSWNvbnNSZXNvbHZlcih7IHByZWZpeDogXCJJY29uXCIsIGV4dGVuc2lvbjogXCJqc3hcIiB9KV0sXHJcblx0XHRcdGRpcnM6IFtcIi4vc3JjLyoqXCIsIFwiIXNyYy9yb3V0ZXMvKipcIl0sXHJcblx0XHRcdGR0czogXCIuL3NyYy9hdXRvLWltcG9ydHMuZC50c1wiLFxyXG5cdFx0fSksXHJcblx0XHRiYWJlbCh7XHJcblx0XHRcdGZpbHRlcjogL1xcLltqdF1zeD8kLyxcclxuXHRcdFx0YmFiZWxDb25maWc6IHtcclxuXHRcdFx0XHRwcmVzZXRzOiBbXCJAYmFiZWwvcHJlc2V0LXR5cGVzY3JpcHRcIl0sXHJcblx0XHRcdFx0cGx1Z2luczogW1tcImJhYmVsLXBsdWdpbi1yZWFjdC1jb21waWxlclwiLCByZWFjdENvbXBpbGVyQ29uZmlnXSwgXCJAYmFiZWwvcGx1Z2luLXN5bnRheC1qc3hcIl0sXHJcblx0XHRcdH0sXHJcblx0XHR9KSxcclxuXHRdLFxyXG5cclxuXHRjc3M6IHtcclxuXHRcdHBvc3Rjc3M6IHtcclxuXHRcdFx0cGx1Z2luczogW3RhaWx3aW5kY3NzLCBhdXRvcHJlZml4ZXJdLFxyXG5cdFx0fSxcclxuXHR9LFxyXG5cclxuXHRkZWZpbmU6IHtcclxuXHRcdF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkoKHBhcnNlVE9NTChhd2FpdCByZWFkRmlsZShcInNyYy10YXVyaS9DYXJnby50b21sXCIsIFwidXRmOFwiKSkgYXMgQ2FyZ29Ub21sKS5wYWNrYWdlLnZlcnNpb24pLFxyXG5cdFx0Ly8gX19BUFBfVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeSgocGFyc2VUT01MKGF3YWl0IEJ1bi5maWxlKFwic3JjLXRhdXJpL0NhcmdvLnRvbWxcIikudGV4dCgpKSBhcyBDYXJnb1RvbWwpLnBhY2thZ2UudmVyc2lvbiksXHJcblx0fSxcclxuXHJcblx0cmVzb2x2ZToge1xyXG5cdFx0YWxpYXM6IHtcclxuXHRcdFx0XCJAXCI6IHBhdGguam9pbihfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcblx0XHRcdFwiQGxpYlwiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjL2xpYlwiKSxcclxuXHRcdFx0XCJAaG9va3NcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9ob29rc1wiKSxcclxuXHRcdFx0XCJAY29udGV4dHNcIjogcGF0aC5qb2luKF9fZGlybmFtZSwgXCIuL3NyYy9jb250ZXh0c1wiKSxcclxuXHRcdFx0XCJAY29tcG9uZW50c1wiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjL2NvbXBvbmVudHNcIiksXHJcblx0XHRcdFwiQHN0b3Jlc1wiOiBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4vc3JjL3N0b3Jlc1wiKSxcclxuXHRcdH0sXHJcblx0fSxcclxuXHQvLyBwcmV2ZW50IHZpdGUgZnJvbSBvYnNjdXJpbmcgcnVzdCBlcnJvcnNcclxuXHRjbGVhclNjcmVlbjogZmFsc2UsXHJcblx0Ly8gVGF1cmkgZXhwZWN0cyBhIGZpeGVkIHBvcnQsIGZhaWwgaWYgdGhhdCBwb3J0IGlzIG5vdCBhdmFpbGFibGVcclxuXHRzZXJ2ZXI6IHtcclxuXHRcdHN0cmljdFBvcnQ6IHRydWUsXHJcblx0fSxcclxuXHQvLyB0byBhY2Nlc3MgdGhlIFRhdXJpIGVudmlyb25tZW50IHZhcmlhYmxlcyBzZXQgYnkgdGhlIENMSSB3aXRoIGluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHRhcmdldFxyXG5cdGVudlByZWZpeDogW1wiVklURV9cIiwgXCJUQVVSSV9FTlZfKlwiXSxcclxuXHRidWlsZDoge1xyXG5cdFx0Ly8gVGF1cmkgdXNlcyBDaHJvbWl1bSBvbiBXaW5kb3dzIGFuZCBXZWJLaXQgb24gbWFjT1MgYW5kIExpbnV4XHJcblx0XHR0YXJnZXQ6IFwiZXNuZXh0XCIsXHJcblx0XHQvLyBkb24ndCBtaW5pZnkgZm9yIGRlYnVnIGJ1aWxkc1xyXG5cdFx0bWluaWZ5OiAhcHJvY2Vzcy5lbnYuVEFVUklfREVCVUcgPyBcImVzYnVpbGRcIiA6IGZhbHNlLFxyXG5cdFx0Ly8gcHJvZHVjZSBzb3VyY2VtYXBzIGZvciBkZWJ1ZyBidWlsZHNcclxuXHRcdHNvdXJjZW1hcDogISFwcm9jZXNzLmVudi5UQVVSSV9ERUJVRyxcclxuXHR9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1VCxTQUFTLGdCQUFnQjtBQUNoVixZQUFZLFVBQVU7QUFDdEIsU0FBUyxtQkFBbUI7QUFDNUIsT0FBTyxrQkFBa0I7QUFFekIsU0FBUyxpQkFBaUI7QUFDMUIsT0FBb0M7QUFDcEMsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxnQkFBZ0I7QUFDdkIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQVpsQixJQUFNLG1DQUFtQztBQWV6QyxJQUFNLHNCQUFzQixFQUFFLFFBQVEsS0FBSztBQUczQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixTQUFTO0FBQUE7QUFBQSxJQUVSLFlBQVk7QUFBQSxJQUNaLE1BQU0sRUFBRSxVQUFVLE9BQU8sS0FBSyxRQUFRLENBQUM7QUFBQSxJQUN2QyxXQUFXO0FBQUEsTUFDVixTQUFTLENBQUMsT0FBTztBQUFBLE1BQ2pCLFdBQVcsQ0FBQyxjQUFjLEVBQUUsUUFBUSxRQUFRLFdBQVcsTUFBTSxDQUFDLENBQUM7QUFBQSxNQUMvRCxNQUFNLENBQUMsWUFBWSxnQkFBZ0I7QUFBQSxNQUNuQyxLQUFLO0FBQUEsSUFDTixDQUFDO0FBQUEsSUFDRCxNQUFNO0FBQUEsTUFDTCxRQUFRO0FBQUEsTUFDUixhQUFhO0FBQUEsUUFDWixTQUFTLENBQUMsMEJBQTBCO0FBQUEsUUFDcEMsU0FBUyxDQUFDLENBQUMsK0JBQStCLG1CQUFtQixHQUFHLDBCQUEwQjtBQUFBLE1BQzNGO0FBQUEsSUFDRCxDQUFDO0FBQUEsRUFDRjtBQUFBLEVBRUEsS0FBSztBQUFBLElBQ0osU0FBUztBQUFBLE1BQ1IsU0FBUyxDQUFDLGFBQWEsWUFBWTtBQUFBLElBQ3BDO0FBQUEsRUFDRDtBQUFBLEVBRUEsUUFBUTtBQUFBLElBQ1AsaUJBQWlCLEtBQUssVUFBVyxVQUFVLE1BQU0sU0FBUyx3QkFBd0IsTUFBTSxDQUFDLEVBQWdCLFFBQVEsT0FBTztBQUFBO0FBQUEsRUFFekg7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLEtBQVUsVUFBSyxrQ0FBVyxPQUFPO0FBQUEsTUFDakMsUUFBYSxVQUFLLGtDQUFXLFdBQVc7QUFBQSxNQUN4QyxVQUFlLFVBQUssa0NBQVcsYUFBYTtBQUFBLE1BQzVDLGFBQWtCLFVBQUssa0NBQVcsZ0JBQWdCO0FBQUEsTUFDbEQsZUFBb0IsVUFBSyxrQ0FBVyxrQkFBa0I7QUFBQSxNQUN0RCxXQUFnQixVQUFLLGtDQUFXLGNBQWM7QUFBQSxJQUMvQztBQUFBLEVBQ0Q7QUFBQTtBQUFBLEVBRUEsYUFBYTtBQUFBO0FBQUEsRUFFYixRQUFRO0FBQUEsSUFDUCxZQUFZO0FBQUEsRUFDYjtBQUFBO0FBQUEsRUFFQSxXQUFXLENBQUMsU0FBUyxhQUFhO0FBQUEsRUFDbEMsT0FBTztBQUFBO0FBQUEsSUFFTixRQUFRO0FBQUE7QUFBQSxJQUVSLFFBQVEsQ0FBQyxRQUFRLElBQUksY0FBYyxZQUFZO0FBQUE7QUFBQSxJQUUvQyxXQUFXLENBQUMsQ0FBQyxRQUFRLElBQUk7QUFBQSxFQUMxQjtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
