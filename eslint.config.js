/* eslint-disable */
import url from "url";

// import reactCompiler from "eslint-plugin-react-compiler";
import reactHook from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default tseslint.config(
   eslint.configs.recommended,
   ...tseslint.configs.strictTypeChecked,
   ...tseslint.configs.stylisticTypeChecked,
   {
      languageOptions: {
         parserOptions: {
            ecmaFeatures: { jsx: true },
            project: ["./tsconfig.json", "./packages/*/tsconfig.json"],
            tsconfigRootDir: import.meta.dirname,
         },
      },
   },
   {
      name: "huginn/global",
      files: [
         "packages/huginn-server/src/**/*.ts",
         "packages/huginn-server-h3/src/**/*.ts",
         "packages/huginn-cdn/src/**/*.ts",
         "packages/huginn-api/src/**/*.ts",
         "packages/huginn-app/src/**/*.{ts,tsx}",
         "packages/huginn-app/**/*.d.ts",
         "packages/huginn-bundler/src/**/*.ts",
         "packages/huginn-shared/src/**/*.ts",
         "packages/huginn-backend-shared/src/**/*.ts",
      ],

      rules: {
         "no-throw-literal": "off",
         "@typescript-eslint/prefer-literal-enum-member": ["error", { allowBitwiseExpressions: true }],
         "@typescript-eslint/await-thenable": "off",
         "@typescript-eslint/consistent-type-definitions": ["off", "type"],
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
         "@typescript-eslint/no-dynamic-delete": "off",
         "@typescript-eslint/no-unnecessary-condition": "off",
         "@typescript-eslint/no-confusing-void-expression": "off",
         "@typescript-eslint/no-unsafe-enum-comparison": "off",
         "@typescript-eslint/only-throw-error": "off",
         "@typescript-eslint/unbound-method": "off",
         "@typescript-eslint/restrict-plus-operands": ["error", { allowNumberAndString: true }],
         "@typescript-eslint/restrict-template-expressions": [
            "error",
            { allowNumber: true, allowBoolean: true, allowNullish: true, allowArray: true, allowAny: true },
         ],
         "@typescript-eslint/no-unused-vars": [
            "error",
            {
               varsIgnorePattern: "^_[A-Za-z0-9]+$",
               argsIgnorePattern: "^_[A-Za-z0-9]+$",
            },
         ],
      },
   },
   {
      name: "huginn/backend",
      files: [
         "packages/huginn-server/src/**/*.ts",
         "packages/huginn-server-h3/src/**/*.ts",
         "packages/huginn-bundler/**/*.ts",
         "packages/huginn-cdn/src/**/*.ts",
         "packages/huginn-backend-shared/src/**/*.ts",
      ],
      languageOptions: {
         globals: globals.node,
      },
   },
   {
      name: "huginn/api",
      files: ["packages/huginn-api/src/**/*.ts"],
      languageOptions: {
         globals: globals.browser,
      },
   },
   {
      name: "huginn/shared",
      files: ["packages/huginn-shared/src/**/*.ts"],
      languageOptions: {
         globals: { ...globals.browser, ...globals.node },
      },
   },
   {
      name: "huginn/app",
      files: ["packages/huginn-app/src/**/*.{ts,tsx}"],
      ignores: ["src-tauri/target/", "dist/"],
      extends: [reactPlugin.configs.flat["jsx-runtime"], ...compat.config(reactHook.configs.recommended)],
      languageOptions: {
         globals: globals.browser,
      },
      // plugins: {
      // "react-compiler": reactCompiler,
      // },
      rules: {
         // "react-compiler/react-compiler": 2,
         "react-hooks/exhaustive-deps": "off",
         "react-hooks/rules-of-hooks": "error",
      },
   },
);
