// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "node:path";

import cloudscapeBuildTools from "@cloudscape-design/build-tools/eslint/index.js";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import headerPlugin from "@tony.ganchev/eslint-plugin-header";
import noUnsanitizedPlugin from "eslint-plugin-no-unsanitized";
import eslintPrettier from "eslint-plugin-prettier/recommended";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import unicornPlugin from "eslint-plugin-unicorn";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default tsEslint.config(
  includeIgnoreFile(path.resolve(".gitignore")),
  {
    settings: {
      react: { version: "detect" },
    },
  },
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  noUnsanitizedPlugin.configs.recommended,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  reactHooksPlugin.configs["recommended-latest"],
  eslintPrettier,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      "@cloudscape-design/build-tools": cloudscapeBuildTools,
      unicorn: unicornPlugin,
      header: headerPlugin,
      "simple-import-sort": simpleImportSortPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true, allowShortCircuit: true }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],
      "react/display-name": "off",
      "react/no-danger": "error",
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "react/forbid-component-props": ["warn", { forbid: ["className", "id"] }],
      "react/jsx-boolean-value": ["error", "always"],
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "unicorn/filename-case": "error",
      curly: "error",
      "dot-notation": "error",
      eqeqeq: "error",
      "no-return-await": "error",
      "require-await": "error",
      "header/header": [
        "error",
        {
          header: {
            commentType: "line",
            lines: [
              " Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.",
              " SPDX-License-Identifier: Apache-2.0",
            ],
          },
          leadingComments: {
            comments: [
              {
                commentType: "block",
                lines: ["*", " * @jest-environment node", " "],
              },
            ],
          },
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["default"],
              message: "Prefer named imports.",
            },
            {
              name: "@cloudscape-design/components",
              message: "Prefer subpath imports.",
            },
          ],
        },
      ],
      "import/no-useless-path-segments": "off",
      "simple-import-sort/imports": "warn",
    },
  },
  {
    files: ["src/**", "pages/**", "test/**", "scripts/**"],
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            ["^react", "^(?!@cloudscape)@?\\w"],
            ["^@cloudscape"],
            ["^~\\w"],
            ["^"],
            ["^.+\\.?(css)$", "^.+\\.?(css.js)$", "^.+\\.?(scss)$", "^.+\\.?(selectors.js)$"],
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**", "src/__tests__/utils.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
      },
    },
  },
  {
    files: ["**/__integ__/**", "test/**"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
  {
    files: ["src/test-utils/dom/**/*.ts"],
    rules: {
      "@cloudscape-design/build-tools/ban-files": [
        "error",
        [
          {
            pattern: "./src/test-utils/dom/index.ts",
            message:
              "Do not import from the augmented ElementWrapper barrel '{{ path }}'. Use @cloudscape-design/test-utils-core/dom instead.",
          },
        ],
      ],
    },
  },
);
