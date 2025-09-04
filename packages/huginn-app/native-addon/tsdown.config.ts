import { defineConfig } from "tsdown";

export default defineConfig({
   entry: ["js/index.ts", "js/test.ts"],
   format: ["cjs"],
   minify: true,
   dts: false,
   noExternal: ["bindings"],
   // env: { NODE_ENV: "production" },
});
