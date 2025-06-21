import { builtinModules } from "node:module";
import { build } from "vite";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins, "application-loopback"];

await build({
   configFile: false,
   build: {
      target: "es2022",
      rollupOptions: { external },
      lib: {
         entry: ["./electron/main.ts", "./electron/preload.ts"],
         name: "main",
         fileName: () => "[name].cjs",
         formats: ["cjs"],
      },
      emptyOutDir: false,
      minify: false,
      copyPublicDir: false,
      outDir: ".vite/build",
   },
   clearScreen: false,
});
