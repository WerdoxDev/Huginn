import deno from "@deno/vite-plugin";
import { join } from "@std/path";
import { parse } from "@std/toml";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import react from "@vitejs/plugin-react-swc";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

type CargoToml = { package: { version: string } };

const dirname = import.meta.dirname || "";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [deno(), react({ devTarget: "esnext" }), TanStackRouterVite(), Icons({ compiler: "jsx" })],

	define: {
		__APP_VERSION__: JSON.stringify((parse(await Deno.readTextFile("src-tauri/Cargo.toml")) as CargoToml).package.version),
	},

	resolve: {
		alias: {
			"@": join(dirname, "./src"),
			"@lib": join(dirname, "./src/lib"),
			"@hooks": join(dirname, "./src/hooks"),
			"@contexts": join(dirname, "./src/contexts"),
			"@components": join(dirname, "./src/components"),
		},
	},
	// // prevent vite from obscuring rust errors
	// clearScreen: false,
	// // Tauri expects a fixed port, fail if that port is not available
	// server: {
	// 	strictPort: true,
	// },
	// // to access the Tauri environment variables set by the CLI with information about the current target
	// envPrefix: ["VITE_", "TAURI_PLATFORM", "TAURI_ARCH", "TAURI_FAMILY", "TAURI_PLATFORM_VERSION", "TAURI_PLATFORM_TYPE", "TAURI_DEBUG"],
	// build: {
	// 	// Tauri uses Chromium on Windows and WebKit on macOS and Linux
	// 	target: "esnext",
	// 	// don't minify for debug builds
	// 	minify: !Deno.env.get("TAURI_DEBUG") ? "esbuild" : false,
	// 	// produce sourcemaps for debug builds
	// 	sourcemap: !!Deno.env.get("TAURI_DEBUG"),
	// },
});
