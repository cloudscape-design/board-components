// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { configure } from "@cloudscape-design/browser-test-tools/use-browser";
import { configureToMatchImageSnapshot } from "jest-image-snapshot";
import { join } from "path";
import { expect } from "vitest";

const snapshotDir = join(__dirname, "./..", process.env.VISUAL_REGRESSION_SNAPSHOT_DIRECTORY ?? "__image_snapshots__");

configure({
  browserName: "ChromeHeadlessIntegration",
  browserCreatorOptions: {
    seleniumUrl: `http://localhost:9515`,
  },
  webdriverOptions: {
    baseUrl: `http://localhost:8000`,
    implicitTimeout: 200,
  },
});

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customSnapshotsDir: snapshotDir,
});

process.env.TEST_HOST = "http://localhost:4173";

expect.extend({ toMatchImageSnapshot });
