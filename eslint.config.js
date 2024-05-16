import eslint from "@eslint/js";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHook from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import reactRecommended from "eslint-plugin-react/configs/jsx-runtime.js";

export default tseslint.config(
   eslint.configs.recommended,
   reactRecommended,
   // reactCompiler.,
   ...tseslint.configs.recommendedTypeChecked,
   ...tseslint.configs.stylisticTypeChecked,
   {
      files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
      plugins: {
         "react-hooks": reactHook,
         "react-compiler": reactCompiler,
         "react-refresh": reactRefresh,
      },
      languageOptions: { parserOptions: { project: "tsconfig.json" } },

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
         "@typescript-eslint/no-unused-vars": [
            "error",
            {
               varsIgnorePattern: "^_[A-Za-z0-9]+$",
               argsIgnorePattern: "^_[A-Za-z0-9]+$",
            },
         ],
      },
   },
);
