// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "path";
import { default as convertToSelectorUtil } from "@cloudscape-design/test-utils-converter";
import { pascalCase } from "change-case";
import { execaSync } from "execa";
import fs from "fs-extra";
import globby from "globby";
import prettier from "prettier";

const prettierOptions = prettier.resolveConfig.sync(".prettierrc");

const components = globby
  .sync(["src/test-utils/dom/**/index.ts", "!src/test-utils/dom/index.ts"])
  .map((fileName) => fileName.replace("src/test-utils/dom/", "").replace("/index.ts", ""));

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
    defaultExport: `export function createWrapper(root: Element = document.body) { if (document && document.body && !document.body.contains(root)) { console.warn('[AwsUi] [test-utils] provided element is not part of the document body, interactions may work incorrectly')}; return new ElementWrapper(root); }`,
    buildFinderInterface: (componentName) =>
      `find${pascalCase(componentName)}(selector?: string): ${pascalCase(componentName)}Wrapper | null;`,
  });
  writeSourceFile("./src/test-utils/dom/index.ts", content);
}

function generateSelectorsIndexFile() {
  const content = generateIndexFileContent({
    testUtilType: "selectors",
    defaultExport: `export function createWrapper(root: string = 'body') { return new ElementWrapper(root); }`,
    buildFinderInterface: (componentName) =>
      `find${pascalCase(componentName)}(selector?: string): ${pascalCase(componentName)}Wrapper;`,
  });
  writeSourceFile("./src/test-utils/selectors/index.ts", content);
}

function generateIndexFileContent({ testUtilType, defaultExport, buildFinderInterface }) {
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
            componentName
          )}Wrapper);
      };`;
    }),
    defaultExport,
  ].join("\n");
}

function compileTypescript() {
  const config = path.resolve("src/test-utils/tsconfig.json");
  execaSync("tsc", ["-p", config, "--sourceMap"], { stdio: "inherit" });
}

function writeSourceFile(filepath, content) {
  fs.ensureDirSync(filepath.replace(/\/index.ts/, ""));
  fs.writeFileSync(filepath, prettify(filepath, content));
}

function prettify(filepath, content) {
  return prettier.format(content, { ...prettierOptions, filepath });
}
