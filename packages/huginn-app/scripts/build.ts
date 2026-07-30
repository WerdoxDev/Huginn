import { builtinModules } from "node:module";
import { build } from "tsdown";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

const isProd = process.argv.includes("--prod");
const noExternal = [
   "@huginnjs/shared",
   "@huginnjs/shared/runtime-analytics",
   "native-addon",
   "loopback-capture",
   "electron-updater",
   "moment",
   "posthog-node",
   "unicode-emoji-json",
   "highlight.js",
   "electron-log",
];

await build({
   entry: ["./electron/main.ts", "./electron/preload.ts"],
   format: ["esm"],

   deps: {
      neverBundle: external,
      alwaysBundle: isProd ? noExternal : ["@huginnjs/shared", "native-addon", "loopback-capture"],

      onlyBundle: false,
   },

   sourcemap: true,
   dts: false,
   outDir: ".electron",
   fixedExtension: true,
   target: "es2022",
   minify: false,
   clean: true,
   shims: true,
});
