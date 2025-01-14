import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
// import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { parseTOML } from "confbox";
import { reactRouterDevTools } from "react-router-devtools";
import tailwindcss from "tailwindcss";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";

type CargoToml = { package: { version: string } };
const reactCompilerConfig = { target: "19" };

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		// reactRouterDevTools(),
		reactRouter(),
		Icons({ compiler: "jsx", jsx: "react" }),
		AutoImport({
			imports: ["react"],
			resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
			dirs: ["./src/**", "!src/routes/**"],
			dts: "./src/auto-imports.d.ts",
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
			"@stores": path.join(__dirname, "./src/stores"),
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
