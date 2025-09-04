import { defineConfig } from "tsdown";

export default defineConfig({
   entry: ["js/*.ts"],
   format: ["cjs"],
   minify: true,
   dts: false,
   noExternal: ["bindings"],
   // env: { NODE_ENV: "production" },
});
