// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "node:path";

import { documentTestUtils, writeComponentsDocumentation } from "@cloudscape-design/documenter";

import { writeSourceFile } from "./utils.js";

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
  const tsconfig = path.resolve("src/test-utils/tsconfig.json");
  ["dom", "selectors"].forEach((testUtilType) => {
    const componentWrapperDefinitions = documentTestUtils({ tsconfig }, `**/{${testUtilType},types}/**/*`);

    const indexContent = `module.exports = {
      classes: ${JSON.stringify(componentWrapperDefinitions)}
    }
    `;

    const outPath = path.join(targetDir, "test-utils-doc", `${testUtilType}.js`);
    writeSourceFile(outPath, indexContent);
  });
}
