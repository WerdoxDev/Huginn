import { builtinModules } from "node:module";
import { build } from "tsdown";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

const isProd = process.argv.includes("--prod");
const noExternal = ["@huginn/shared", "@std/encoding", "electron-log/main", "electron-updater", "sharp"];

await build({
   entry: ["./electron/main.ts", "./electron/preload.ts"],
   format: ["cjs"],
   external: external,
   outDir: ".electron",
   target: "es2022",
   minify: false,
   clean: true,
   noExternal: isProd ? noExternal : ["@huginn/shared"],
});
