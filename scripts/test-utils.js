// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { execaSync } from "execa";
import { globbySync } from "globby";
import path from "node:path";

import { generateTestUtils } from "@cloudscape-design/test-utils-converter";

import { pluralizeComponentName } from "./pluralize.js";
import { pascalCase } from "./utils.js";

const componentNames = globbySync(["src/test-utils/dom/**/index.ts", "!src/test-utils/dom/index.ts"]).map(
  (filePath) => {
    const fileNameKebabCase = filePath.replace("src/test-utils/dom/", "").replace("/index.ts", "");
    return pascalCase(fileNameKebabCase);
  },
);

generateTestUtils({
  testUtilsPath: path.resolve("src/test-utils"),
  components: componentNames.map((name) => ({
    name,
    pluralName: pluralizeComponentName(name),
  })),
});

function compileTypescript() {
  const config = path.resolve("src/test-utils/tsconfig.json");
  execaSync("tsc", ["-p", config, "--sourceMap", "--inlineSources"], { stdio: "inherit" });
}

compileTypescript();
