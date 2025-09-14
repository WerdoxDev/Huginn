import { defineConfig } from "tsdown";

export default defineConfig({
   entry: ["js/*.ts"],
   format: ["cjs"],
   minify: false,
   dts: true,
   noExternal: ["bindings", "fast-xml-parser"],
   // env: { NODE_ENV: "production" },
});
