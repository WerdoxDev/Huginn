import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
   { files: ["**/*.{js,mjs,cjs,ts}"] },
   { languageOptions: { globals: globals.browser } },
   pluginJs.configs.recommended,
   ...tseslint.configs.recommendedTypeChecked,
   ...tseslint.configs.stylisticTypeChecked,
   {
      languageOptions: { parserOptions: { project: "tsconfig.json" } },
      rules: {
         "@typescript-eslint/consistent-type-definitions": ["error", "type"],
         "@typescript-eslint/no-unsafe-assignment": "off",
         "@typescript-eslint/no-unsafe-argument": "off",
         "@typescript-eslint/no-unsafe-member-access": "off",
         "@typescript-eslint/no-unsafe-return": "off",
         "@typescript-eslint/no-unsafe-call": "off",
         "@typescript-eslint/no-misused-promises": "off",
         "@typescript-eslint/no-unnecessary-type-assertion": "off",
         "@typescript-eslint/no-floating-promises": "off",
         "@typescript-eslint/no-empty-function": "off",
         "@typescript-eslint/no-redundant-type-constituents": "off",
         "@typescript-eslint/no-unused-vars": [
            "error",
            {
               varsIgnorePattern: "^_[A-Za-z0-9]+$",
               argsIgnorePattern: "^_[A-Za-z0-9]+$",
            },
         ],
      },
   },
];
