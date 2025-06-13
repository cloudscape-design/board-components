/* eslint-env node */
/* eslint-disable header/header */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as fs from "node:fs";
import * as path from "node:path";

const componentsDir = path.resolve(__dirname, "../../lib/components");

export function getAllComponents(): string[] {
  return fs
    .readdirSync(componentsDir)
    .filter(
      (name) =>
        name !== "internal" &&
        name !== "test-utils" &&
        !name.includes(".") &&
        !name.includes("LICENSE") &&
        !name.includes("NOTICE"),
    );
}

export async function requireComponent(componentName: string) {
  // eslint-disable-next-line no-unsanitized/method
  const { default: Component } = await import(path.join(componentsDir, componentName));
  return Component;
}
