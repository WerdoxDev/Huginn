import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
// import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { parseTOML } from "confbox";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

type CargoToml = { package: { version: string } };

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		reactRouter(),
		Icons({ compiler: "jsx", jsx: "react" }),
		AutoImport({
			imports: ["react"],
			resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
			dirs: ["./src/**", "!src/routes/**"],
			dts: "./src/auto-imports.d.ts",
		}),
	],

	define: {
		__APP_VERSION__: JSON.stringify((parseTOML(await readFile("src-tauri/Cargo.toml", "utf8")) as CargoToml).package.version),
		// __APP_VERSION__: JSON.stringify((parseTOML(await Bun.file("src-tauri/Cargo.toml").text()) as CargoToml).package.version),
	},

	resolve: {
		alias: {
			"@": path.join(__dirname, "./src"),
			"@lib": path.join(__dirname, "./src/lib"),
			"@hooks": path.join(__dirname, "./src/hooks"),
			"@contexts": path.join(__dirname, "./src/contexts"),
			"@components": path.join(__dirname, "./src/components"),
		},
	},
	// prevent vite from obscuring rust errors
	clearScreen: false,
	// Tauri expects a fixed port, fail if that port is not available
	server: {
		strictPort: true,
	},
	// to access the Tauri environment variables set by the CLI with information about the current target
	envPrefix: ["VITE_", "TAURI_ENV_*"],
	build: {
		// Tauri uses Chromium on Windows and WebKit on macOS and Linux
		target: "esnext",
		// don't minify for debug builds
		minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
		// produce sourcemaps for debug builds
		sourcemap: !!process.env.TAURI_DEBUG,
	},
});
