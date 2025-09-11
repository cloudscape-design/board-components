// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "node:path";

import { writeComponentsDocumentation, writeTestUtilsDocumentation } from "@cloudscape-design/documenter";

const targetDir = "lib/components/internal/api-docs";

componentDocs();
testUtilDocs();

function componentDocs() {
  writeComponentsDocumentation({
    outDir: path.join(targetDir, "components"),
    tsconfigPath: path.resolve("tsconfig.json"),
    publicFilesGlob: "src/*/index.tsx",
  });
}

function testUtilDocs() {
  writeTestUtilsDocumentation({
    outDir: path.join(targetDir, "test-utils-doc"),
    tsconfigPath: path.resolve("src/test-utils/tsconfig.json"),
    domUtils: {
      root: "src/test-utils/dom/index.ts",
      extraExports: ["default", "ElementWrapper"],
    },
    selectorsUtils: {
      root: "src/test-utils/selectors/index.ts",
      extraExports: ["default", "ElementWrapper"],
    },
  });
}
