import { defineConfig } from "tsdown";

export default defineConfig({
   entry: ["js/index.ts"],
   format: ["cjs"],
   minify: true,
   dts: false,
   noExternal: ["bindings"],
});
