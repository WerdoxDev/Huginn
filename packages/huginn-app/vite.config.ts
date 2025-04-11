import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
// import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { parseTOML } from "confbox";
import tailwindcss from "tailwindcss";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { version } from "./package.json";

type CargoToml = { package: { version: string } };
const reactCompilerConfig = { target: "19" };

// https://vitejs.dev/config/
export default defineConfig({
	base: "./",
	plugins: [
		// reactRouterDevTools(),
		react({ jsxRuntime: "automatic" }),
		// reactRouter(),
		Icons({ compiler: "jsx" }),
		AutoImport({
			resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
			// dts: "./src/auto-imports.d.ts",
		}),
		babel({
			filter: /\.[jt]sx?$/,
			babelConfig: {
				presets: ["@babel/preset-typescript"],
				plugins: [["babel-plugin-react-compiler", reactCompilerConfig], "@babel/plugin-syntax-jsx"],
			},
		}),
	],

	css: {
		postcss: {
			plugins: [tailwindcss, autoprefixer],
		},
	},

	define: {
		__APP_VERSION__: JSON.stringify(version.toString()),
		// __APP_VERSION__: JSON.stringify((parseTOML(await Bun.file("src-tauri/Cargo.toml").text()) as CargoToml).package.version),
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
	// prevent vite from obscuring rust errors
	clearScreen: false,
	// Tauri expects a fixed port, fail if that port is not available
	server: {
		// strictPort: true,
	},
	build: {
		target: "esnext",
		outDir: "./dist",
	},
	// to access the Tauri environment variables set by the CLI with information about the current target
	// build: {
	// 	// Tauri uses Chromium on Windows and WebKit on macOS and Linux
	// 	target: "esnext",
	// 	// don't minify for debug builds
	// 	minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
	// 	// produce sourcemaps for debug builds
	// 	sourcemap: !!process.env.TAURI_DEBUG,
	// },
});
