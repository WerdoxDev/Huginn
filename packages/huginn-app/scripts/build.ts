import { builtinModules } from "node:module";
import path from "node:path";
import { build } from "vite";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins, "application-loopback"];

await build({
   configFile: false,
   build: {
      target: "es2022",
      rollupOptions: {
         external,
      },
      lib: {
         entry: ["./electron/main.ts", "./electron/preload.ts"],
         // fileName: () => "[name].cjs",
         formats: ["cjs"],
      },
      minify: false,
      emptyOutDir: true,
      copyPublicDir: false,
      outDir: ".vite/build",
   },
   clearScreen: false,
});
