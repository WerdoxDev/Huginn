import { builtinModules } from "node:module";
import { build } from "tsdown";

export const builtins = ["electron", ...builtinModules.flatMap((m) => [m, `node:${m}`])];
export const external = [...builtins];

await build({
   entry: ["./electron/main.ts", "./electron/preload.ts"],
   format: ["cjs"],
   external: external,
   outDir: ".electron",
   target: "es2022",
   minify: false,
   clean: true,
   noExternal: ["@huginn/shared", "@std/encoding", "application-loopback", "electron-log/main", "electron-updater"],
   // configFile: false,
   // build: {
   //    target: "es2022",
   //    rollupOptions: {
   //       external,
   //    },
   //    lib: {
   //       entry: ["./electron/main.ts", "./electron/preload.ts"],
   //       // fileName: () => "[name].cjs",
   //       formats: ["cjs"],
   //    },
   //    minify: false,
   //    emptyOutDir: true,
   //    copyPublicDir: false,
   //    outDir: ".vite/build",
   // },
   // clearScreen: false,
});
