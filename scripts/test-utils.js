// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { execaSync } from "execa";
import { globbySync } from "globby";
import fs from "node:fs";
import path from "node:path";

import { default as convertToSelectorUtil } from "@cloudscape-design/test-utils-converter";

import { pluralizeComponentName } from "./pluralize.js";
import { pascalCase, writeSourceFile } from "./utils.js";

const components = globbySync(["src/test-utils/dom/**/index.ts", "!src/test-utils/dom/index.ts"]).map((fileName) =>
  fileName.replace("src/test-utils/dom/", "").replace("/index.ts", ""),
);

function toWrapper(componentClass) {
  return `${componentClass}Wrapper`;
}

const configs = {
  common: {
    buildFinder: ({ componentName, componentNamePlural }) => `
      ElementWrapper.prototype.find${componentName} = function(selector) {
        const rootSelector = \`.$\{${toWrapper(componentName)}.rootSelector}\`;
        // casting to 'any' is needed to avoid this issue with generics
        // https://github.com/microsoft/TypeScript/issues/29132
        return (this as any).findComponent(selector ? appendSelector(selector, rootSelector) : rootSelector, ${toWrapper(componentName)});
      };

      ElementWrapper.prototype.findAll${componentNamePlural} = function(selector) {
        return this.findAllComponents(${toWrapper(componentName)}, selector);
      };`,
  },
  dom: {
    defaultExport: `export default function wrapper(root: Element = document.body) { if (document && document.body && !document.body.contains(root)) { console.warn('[AwsUi] [test-utils] provided element is not part of the document body, interactions may work incorrectly')}; return new ElementWrapper(root); }`,
    buildFinderInterface: ({ componentName, componentNamePlural }) => `
       /**
        * Returns the wrapper of the first ${componentName} that matches the specified CSS selector.
        * If no CSS selector is specified, returns the wrapper of the first ${componentName}.
        * If no matching ${componentName} is found, returns \`null\`.
        *
        * @param {string} [selector] CSS Selector
        * @returns {${toWrapper(componentName)} | null}
        */
       find${componentName}(selector?: string): ${toWrapper(componentName)} | null;

       /**
        * Returns an array of ${componentName} wrapper that matches the specified CSS selector.
        * If no CSS selector is specified, returns all of the ${componentNamePlural} inside the current wrapper.
        * If no matching ${componentName} is found, returns an empty array.
        *
        * @param {string} [selector] CSS Selector
        * @returns {Array<${toWrapper(componentName)}>}
        */
       findAll${componentNamePlural}(selector?: string): Array<${toWrapper(componentName)}>;`,
  },
  selectors: {
    defaultExport: `export default function wrapper(root: string = 'body') { return new ElementWrapper(root); }`,
    buildFinderInterface: ({ componentName, componentNamePlural }) => `
       /**
        * Returns a wrapper that matches the ${componentNamePlural} with the specified CSS selector.
        * If no CSS selector is specified, returns a wrapper that matches ${componentNamePlural}.
        *
        * @param {string} [selector] CSS Selector
        * @returns {${toWrapper(componentName)}}
        */
       find${componentName}(selector?: string): ${toWrapper(componentName)};

       /**
        * Returns a multi-element wrapper that matches ${componentNamePlural} with the specified CSS selector.
        * If no CSS selector is specified, returns a multi-element wrapper that matches ${componentNamePlural}.
        *
        * @param {string} [selector] CSS Selector
        * @returns {MultiElementWrapper<${toWrapper(componentName)}>}
        */
       findAll${componentNamePlural}(selector?: string): MultiElementWrapper<${toWrapper(componentName)}>;`,
  },
};

function generateTestUtilMetaData() {
  const testUtilsSrcDir = path.resolve("src/test-utils");
  const metaData = components.reduce((allMetaData, componentFolderName) => {
    const absPathComponentFolder = path.resolve(testUtilsSrcDir, componentFolderName);
    const relPathTestUtilFile = `./${path.relative(testUtilsSrcDir, absPathComponentFolder)}`;

    const componentNameKebab = componentFolderName;
    const componentName = pascalCase(componentNameKebab);
    const componentNamePlural = pluralizeComponentName(componentName);

    const componentMetaData = {
      componentName,
      componentNamePlural,
      relPathTestUtilFile,
    };

    return allMetaData.concat(componentMetaData);
  }, []);

  return metaData;
}

function generateFindersInterfaces({ testUtilMetaData, testUtilType, configs }) {
  const { buildFinderInterface } = configs[testUtilType];
  const findersInterfaces = testUtilMetaData.map(buildFinderInterface);

  // we need to redeclare the interface in its original definition, extending a re-export will not work
  // https://github.com/microsoft/TypeScript/issues/12607
  const interfaces = `declare module '@cloudscape-design/test-utils-core/dist/${testUtilType}' {
      interface ElementWrapper {
        ${findersInterfaces.join("\n")}
      }
  }`;

  return interfaces;
}

function generateFindersImplementations({ testUtilMetaData, configs }) {
  const { buildFinder } = configs.common;
  const findersImplementations = testUtilMetaData.map(buildFinder);
  return findersImplementations.join("\n");
}

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
    testUtilMetaData: generateTestUtilMetaData(),
  });
  writeSourceFile("./src/test-utils/dom/index.ts", content);
}

function generateSelectorsIndexFile() {
  const content = generateIndexFileContent({
    testUtilType: "selectors",
    testUtilMetaData: generateTestUtilMetaData(),
  });
  writeSourceFile("./src/test-utils/selectors/index.ts", content);
}

function generateIndexFileContent({ testUtilType, testUtilMetaData }) {
  const config = configs[testUtilType];
  if (config === undefined) {
    throw new Error("Unknown test util type");
  }

  return [
    // language=TypeScript
    `import { ElementWrapper } from '@cloudscape-design/test-utils-core/${testUtilType}';`,
    `import '@cloudscape-design/components/test-utils/${testUtilType}';`,
    `import { appendSelector } from '@cloudscape-design/test-utils-core/utils';`,
    `export { ElementWrapper };`,
    ...testUtilMetaData.map((metaData) => {
      const { componentName, relPathTestUtilFile } = metaData;

      return `
        import ${toWrapper(componentName)} from '${relPathTestUtilFile}';
        export { ${componentName}Wrapper };
      `;
    }),
    generateFindersInterfaces({ testUtilMetaData, testUtilType, configs }),
    generateFindersImplementations({ testUtilMetaData, configs }),
    config.defaultExport,
  ].join("\n");
}

function compileTypescript() {
  const config = path.resolve("src/test-utils/tsconfig.json");
  execaSync("tsc", ["-p", config, "--sourceMap", "--inlineSources"], { stdio: "inherit" });
}
