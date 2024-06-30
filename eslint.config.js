import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import { fixupConfigRules } from "@eslint/compat";
import reactHook from "eslint-plugin-react-hooks";
import reactCompiler from "eslint-plugin-react-compiler";

export default [
   { ignores: ["src-tauri/target/", "dist/"] },
   { languageOptions: { parserOptions: { ecmaFeatures: { jsx: true }, project: "tsconfig.json" } } },
   { languageOptions: { globals: globals.browser } },
   pluginJs.configs.recommended,
   ...tseslint.configs.recommendedTypeChecked,
   ...tseslint.configs.stylisticTypeChecked,
   ...fixupConfigRules(pluginReactConfig),
   {
      plugins: {
         "react-hooks": reactHook,
         "react-compiler": reactCompiler,
      },

      rules: {
         "react-compiler/react-compiler": 2,
         // "react-refresh/only-export-components": ["warn", { allowConstantExport: false }],
         "react-hooks/exhaustive-deps": "off",
         "react-hooks/rules-of-hooks": "error",
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
