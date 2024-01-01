// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import process from "node:process";
import { defineConfig } from "vite";
import functional from "./vite.e2e-functional.config.mjs";

// https://vitejs.dev/config/
export default defineConfig({
  ...functional,
  test: {
    ...functional.test,
    update: process.env.UPDATE_SCREENSHOTS,
    reporters: ["default", "./vitest-reporter/reporter.ts"],
    include: ["./test/visual/**/*.test.ts"],
    setupFiles: [...functional.test.setupFiles, "./test/visual-test-setup.ts"],
  },
});
