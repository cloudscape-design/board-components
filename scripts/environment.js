// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from "fs";
import process from "node:process";
import path from "path";
import prettier from "prettier";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const gitCommitVersion = (process.env.GITHUB_SHA || "HEAD").slice(0, 8);
const packageVersion = `${pkg.version} (${gitCommitVersion})`;

const basePath = "lib/components/internal/environment";
const values = {
  PACKAGE_SOURCE: "board-components",
  PACKAGE_VERSION: packageVersion,
  THEME: "default",
  ALWAYS_VISUAL_REFRESH: false,
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
  fs.writeFileSync(filepath, prettify(filepath, content));
}

function prettify(filepath, content) {
  const prettierConfigPath = path.join(process.cwd(), ".prettierrc");
  const prettierOptions = prettier.resolveConfig.sync(prettierConfigPath);

  if (prettierOptions && [".ts", ".js", ".json"].some((ext) => filepath.endsWith(ext))) {
    return prettier.format(content, { ...prettierOptions, filepath });
  }
  return content;
}
