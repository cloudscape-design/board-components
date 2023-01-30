// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import process from "node:process";
import { defineConfig } from "vite";
import base from "./vite.config.js";

// https://vitejs.dev/config/
export default defineConfig({
  ...base,
  root: "./",
  test: {
    include: ["./src/**/__tests__/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    coverage: {
      enabled: process.env.CI === "true",
      provider: "istanbul",
      include: ["src/**"],
      exclude: ["**/debug-tools/**"],
    },
  },
});
