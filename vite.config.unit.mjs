// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import process from "node:process";
import { defineConfig } from "vite";
import base from "./vite.config.mjs";

// https://vitejs.dev/config/
export default defineConfig({
  ...base,
  root: "./",
  test: {
    include: ["./src/**/__tests__/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      enabled: process.env.CI === "true",
      provider: "v8",
      reporter: ["clover", "lcov", "html", "json"],
      include: ["src/**", "lib/components/**"],
      exclude: ["**/debug-tools/**", "**/__tests__/**", "**/*.d.ts"],
    },
  },
});
