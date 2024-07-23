// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { configureToMatchImageSnapshot } from "jest-image-snapshot";
import { join } from "path";
import { expect } from "vitest";

const snapshotDir = join(__dirname, "./..", process.env.VISUAL_REGRESSION_SNAPSHOT_DIRECTORY ?? "__image_snapshots__");

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customSnapshotsDir: snapshotDir,
});

expect.extend({ toMatchImageSnapshot });
