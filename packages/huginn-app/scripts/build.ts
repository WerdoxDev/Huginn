import { builtinModules } from "node:module";
import { build } from "tsdown";
import "dotenv/config";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

const isProd = process.argv.includes("--prod");
const publicPosthogKey = process.env.VITE_PUBLIC_POSTHOG_KEY;

if (isProd && !publicPosthogKey) {
   throw new Error("VITE_PUBLIC_POSTHOG_KEY must be set when building the production Electron app.");
}

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
   define: {
      "process.env.VITE_PUBLIC_POSTHOG_KEY": JSON.stringify(publicPosthogKey ?? ""),
   },

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
