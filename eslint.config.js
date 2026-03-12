import js from "@eslint/js";
import globals from "globals";
import importX from "eslint-plugin-import-x";
import vitest from "eslint-plugin-vitest";
import playwright from "eslint-plugin-playwright";

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
      "no-duplicate-imports": "error",
      "no-unused-vars": [
        "error",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "consistent-return": "error",
      "import-x/no-cycle": "error",
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
    files: ["app.js", "presets.js", "core/**/*.js", "ui/**/*.js", "viz/**/*.js"],
    rules: {
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: false,
          optionalDependencies: false,
          peerDependencies: false,
          bundledDependencies: false,
          packageDir: ["."],
        },
      ],
    },
  },
  {
    files: ["core/**/*.js"],
    rules: {
      complexity: ["warn", 10],
      "no-restricted-imports": [
        "error",
        {
          patterns: ["../ui/**", "./ui/**", "../viz/**", "./viz/**"],
        },
      ],
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
    files: ["ui/**/*.js"],
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
  {
    files: ["viz/**/*.js"],
    rules: {
      complexity: ["warn", 20],
      "no-restricted-imports": [
        "error",
        {
          patterns: ["../ui/**", "./ui/**"],
        },
      ],
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
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      vitest,
    },
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": "error",
    },
  },
  {
    files: ["e2e/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      playwright,
    },
    rules: {
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": "error",
      "playwright/no-wait-for-timeout": "error",
    },
  },
];
