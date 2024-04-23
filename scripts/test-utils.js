// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from "node:fs";
import path from "node:path";
import { default as convertToSelectorUtil } from "@cloudscape-design/test-utils-converter";
import { execaSync } from "execa";
import { globbySync } from "globby";
import { pascalCase, writeSourceFile } from "./utils.js";

const components = globbySync(["src/test-utils/dom/**/index.ts", "!src/test-utils/dom/index.ts"]).map((fileName) =>
  fileName.replace("src/test-utils/dom/", "").replace("/index.ts", ""),
);

generateSelectorUtils();
generateDomIndexFile();
generateSelectorsIndexFile();
compileTypescript();

function generateSelectorUtils() {
  components.forEach((componentName) => {
    const domFileName = `./src/test-utils/dom/${componentName}/index.ts`;
    const domFileContent = fs.readFileSync(domFileName, "utf-8");
    const selectorsFileName = `./src/test-utils/selectors/${componentName}/index.ts`;
    const selectorsFileContent = convertToSelectorUtil.default(domFileContent);
    writeSourceFile(selectorsFileName, selectorsFileContent);
  });
}

function generateDomIndexFile() {
  const content = generateIndexFileContent({
    testUtilType: "dom",
    buildFinderInterface: (componentName) =>
      `find${pascalCase(componentName)}(selector?: string): ${pascalCase(componentName)}Wrapper | null;`,
  });
  writeSourceFile("./src/test-utils/dom/index.ts", content);
}

function generateSelectorsIndexFile() {
  const content = generateIndexFileContent({
    testUtilType: "selectors",
    buildFinderInterface: (componentName) =>
      `find${pascalCase(componentName)}(selector?: string): ${pascalCase(componentName)}Wrapper;`,
  });
  writeSourceFile("./src/test-utils/selectors/index.ts", content);
}

function generateIndexFileContent({ testUtilType, buildFinderInterface }) {
  return [
    // language=TypeScript
    `import { ElementWrapper } from '@cloudscape-design/test-utils-core/${testUtilType}';`,
    `import { appendSelector } from '@cloudscape-design/test-utils-core/utils';`,
    `export { ElementWrapper };`,
    ...components.map((componentName) => {
      const componentImport = `./${componentName}/index`;
      return `
        import ${pascalCase(componentName)}Wrapper from '${componentImport}';
        export { ${pascalCase(componentName)}Wrapper };
      `;
    }),
    // we need to redeclare the interface in its original definition, extending a re-export will not work
    // https://github.com/microsoft/TypeScript/issues/12607
    `declare module '@cloudscape-design/test-utils-core/dist/${testUtilType}' {
      interface ElementWrapper {
        ${components.map((componentName) => buildFinderInterface(componentName)).join("\n")}
      }
    }`,
    ...components.map((componentName) => {
      // language=TypeScript
      return `ElementWrapper.prototype.find${pascalCase(componentName)} = function(selector) {
          const rootSelector = \`.$\{${pascalCase(componentName)}Wrapper.rootSelector}\`;
          // casting to 'any' is needed to avoid this issue with generics
          // https://github.com/microsoft/TypeScript/issues/29132
          return (this as any).findComponent(selector ? appendSelector(selector, rootSelector) : rootSelector, ${pascalCase(
            componentName,
          )}Wrapper);
      };`;
    }),
    `export { createWrapper as default } from '@cloudscape-design/test-utils-core/${testUtilType}';`,
  ].join("\n");
}

function compileTypescript() {
  const config = path.resolve("src/test-utils/tsconfig.json");
  execaSync("tsc", ["-p", config, "--sourceMap"], { stdio: "inherit" });
}
