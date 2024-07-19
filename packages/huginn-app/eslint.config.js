import { fixupConfigRules } from "@eslint/compat";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHook from "eslint-plugin-react-hooks";
import pluginReactConfig from "eslint-plugin-react/configs/jsx-runtime.js";
import globals from "globals";
import rootConfig from "../../eslint.config.js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
   ...rootConfig,
   ...fixupConfigRules(pluginReactConfig),
   {
      ignores: ["src-tauri/target/", "dist/"],
      languageOptions: { globals: globals.browser },
      plugins: {
         "react-hooks": reactHook,
         "react-compiler": reactCompiler,
      },
      rules: {
         "react-compiler/react-compiler": 2,
         "react-hooks/exhaustive-deps": "off",
         "react-hooks/rules-of-hooks": "error",
      },
   },
];
