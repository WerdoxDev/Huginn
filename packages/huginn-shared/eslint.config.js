import globals from "globals";
import rootConfig from "../../eslint.config.js";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [...rootConfig, { languageOptions: { globals: { ...globals.browser, ...globals.node } } }];
