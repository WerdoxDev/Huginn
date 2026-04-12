import { defineConfig } from "oxfmt";

export default defineConfig({
   $schema: "./node_modules/oxfmt/configuration_schema.json",
   tabWidth: 3,
   endOfLine: "crlf",
   useTabs: false,
   singleQuote: false,
   printWidth: 150,
   sortImports: {
      groups: [
         "type-import",
         ["value-builtin", "value-external"],
         "type-internal",
         "value-internal",
         ["type-parent", "type-sibling", "type-index"],
         ["value-parent", "value-sibling", "value-index"],
         "unknown",
      ],
   },
   sortTailwindcss: {
      //   "stylesheet": "packages/huginn-app/src/index.css",
      functions: ["clsx", "cn"],
      attributes: ["className"],
      preserveWhitespace: false,
   },
});
