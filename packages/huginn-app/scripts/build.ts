import { builtinModules } from "node:module";
import { build } from "vite";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

await build({
	configFile: false,
	build: {
		target: "es2022",
		rollupOptions: { external },
		lib: {
			entry: ["./electron/main.ts", "./electron/preload.ts"],
			name: "main",
			fileName: (_, entryName) => `${entryName}.cjs`,
			formats: ["cjs"],
		},
		emptyOutDir: true,
		minify: false,
		copyPublicDir: false,
		outDir: ".vite/build",
	},
	clearScreen: false,
});
