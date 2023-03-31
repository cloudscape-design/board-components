// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from "node:fs";
import path from "node:path";
import process from "node:process";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const gitCommitVersion = (process.env.GITHUB_SHA || "HEAD").slice(0, 8);
const packageVersion = `${pkg.version} (${gitCommitVersion})`;

const basePath = "lib/components/internal/environment";
const values = {
  PACKAGE_SOURCE: "board-components",
  PACKAGE_VERSION: packageVersion,
  THEME: "open-source-visual-refresh",
  ALWAYS_VISUAL_REFRESH: true,
};
writeFile(
  `${basePath}.js`,
  Object.entries(values)
    .map(([key, value]) => `export var ${key} = ${JSON.stringify(value)};`)
    .join("\n")
);
writeFile(
  `${basePath}.d.ts`,
  Object.keys(values)
    .map((key) => `export const ${key}: string;`)
    .join("\n")
);

function writeFile(filepath, content) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
}
