// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import os from "node:os";
import { defineConfig } from "vite";
import base from "./vite.config.mjs";

// https://vitejs.dev/config/
export default defineConfig({
  ...base,
  root: "./",
  test: {
    environment: "node",
    testTimeout: 60000,
    include: ["./test/functional/**/*.test.ts"],
    setupFiles: ["./test/test-setup.ts"],
    globalSetup: ["./test/global-setup.ts"],
    poolOptions: {
      threads: {
        minThreads: 1,
        // leave half of CPU capacity for Chrome browser processes
        maxThreads: Math.max(Math.floor(os.cpus().length / 2), 1),
      },
    },
  },
});
