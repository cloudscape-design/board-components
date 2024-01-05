// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ fastRefresh: false })],
  root: "./pages",
  base: "./",
  resolve: {
    alias: {
      lodash: "lodash-es",
    },
  },
  server: {
    open: "/index.html",
  },
  build: {
    sourcemap: true,
    outDir: "../dist",
  },
});
