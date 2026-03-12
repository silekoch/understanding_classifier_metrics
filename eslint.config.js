import js from "@eslint/js";
import globals from "globals";
import importX from "eslint-plugin-import-x";

export default [
  {
    ignores: ["node_modules/**", "dist/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "import-x": importX,
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      complexity: ["warn", 12],
      "max-lines": [
        "warn",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "max-lines-per-function": [
        "warn",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "import-x/no-unused-modules": [
        "error",
        {
          unusedExports: true,
          missingExports: false,
          ignoreExports: ["eslint.config.js", "e2e/**"],
        },
      ],
    },
  },
  {
    files: ["core/**/*.js"],
    rules: {
      complexity: ["warn", 10],
      "max-lines-per-function": [
        "warn",
        {
          max: 70,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: ["ui/**/*.js", "viz/**/*.js"],
    rules: {
      complexity: ["warn", 20],
      "max-lines-per-function": [
        "warn",
        {
          max: 140,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
];
