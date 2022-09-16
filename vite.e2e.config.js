// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { defineConfig } from "vite";
import base from "./vite.config.js";

// https://vitejs.dev/config/
export default defineConfig({
  ...base,
  test: {
    environment: "node",
    dir: "./test",
    setupFiles: [`./test/test-setup.ts`],
    globalSetup: [`./test/global-setup.ts`],
  },
});
