// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "node:path";

import { documentComponents, documentTestUtils } from "@cloudscape-design/documenter";

import { listPublicDirs, writeSourceFile } from "./utils.js";

const publicDirs = listPublicDirs("src");
const targetDir = "lib/components/internal/api-docs";

componentDocs();
testUtilDocs();

function validatePublicFiles(definitionFiles) {
  for (const publicDir of publicDirs) {
    if (!definitionFiles.includes(publicDir)) {
      throw new Error(`Directory src/${publicDir} does not have a corresponding API definition`);
    }
  }
}

function componentDocs() {
  const definitions = documentComponents({
    tsconfigPath: path.resolve("tsconfig.json"),
    publicFilesGlob: "src/*/index.tsx",
  });
  const outDir = path.join(targetDir, "components");
  for (const definition of definitions) {
    writeSourceFile(
      path.join(outDir, definition.dashCaseName + ".js"),
      `module.exports = ${JSON.stringify(definition, null, 2)};`,
    );
  }
  const indexContent = `module.exports = {
    ${definitions.map((definition) => `${JSON.stringify(definition.dashCaseName)}:require('./${definition.dashCaseName}')`).join(",\n")}
  }`;
  writeSourceFile(path.join(outDir, "index.js"), indexContent);
  validatePublicFiles(definitions.map((def) => def.dashCaseName));
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
