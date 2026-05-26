import { builtinModules } from "node:module";
import { build } from "tsdown";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

const isProd = process.argv.includes("--prod");
const noExternal = ["@huginn/shared", "native-addon", "electron-log/main", "electron-updater", "sharp", "moment"];

await build({
   entry: ["./electron/main.ts", "./electron/preload.ts"],
   format: ["esm"],

   deps: {
      neverBundle: external,
      alwaysBundle: isProd ? noExternal : ["@huginn/shared", "native-addon"],

      onlyBundle: false,
   },
   dts: false,
   outDir: ".electron",
   fixedExtension: true,
   target: "es2022",
   minify: false,
   clean: true,
   shims: true,
});
