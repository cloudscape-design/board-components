// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "vite";
import functional from "./vite.e2e-functional.config.js";

// https://vitejs.dev/config/
export default defineConfig({
  ...functional,
  test: {
    ...functional.test,
    include: ["./test/visual/**/*.test.ts"],
    setupFiles: [...functional.test.setupFiles, "./test/visual-test-setup.ts"],
  },
});
