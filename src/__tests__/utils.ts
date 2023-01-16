/* eslint-env node */
/* eslint-disable header/header */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import * as path from "node:path";

const componentsDir = path.resolve(__dirname, "../../lib/components");
const definitionsDir = path.resolve(__dirname, "../../lib/components-api/components");

export function getAllComponents(): string[] {
  return fs
    .readdirSync(componentsDir)
    .filter((name) => name !== "internal" && name !== "test-utils" && !name.includes(".") && !name.includes("LICENSE"));
}

export function requireComponent(componentName: string) {
  return require(path.join(componentsDir, componentName));
}

export function requireComponentDefinition(componentName: string) {
  return require(path.join(definitionsDir, componentName));
}
