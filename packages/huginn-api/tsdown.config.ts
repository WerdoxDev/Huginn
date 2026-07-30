import { defineConfig } from "tsdown";

export default defineConfig({
   entry: ["src/index.ts"],
   format: ["cjs", "esm"],
   deps: { alwaysBundle: ["@huginnjs/shared"] },
   dts: true,
   clean: true,
   sourcemap: true,
   minify: true
});
