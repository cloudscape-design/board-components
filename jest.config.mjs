// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import merge from "merge";
import tsPreset from "ts-jest/jest-preset.js";
import cloudscapePreset from "@cloudscape-design/jest-preset";

export default merge.recursive(tsPreset, cloudscapePreset, {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  testEnvironment: "jsdom",
});
