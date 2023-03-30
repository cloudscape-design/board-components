// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { globbySync } from "globby";
const cwd = process.cwd();

const targetDir = path.join(cwd, "./lib/components-themeable/internal");

const stylesSourceDir = path.join(cwd, "./src/");
const stylesTargetDir = path.join(targetDir, "/scss");

const componentsSourceDir = path.join(cwd, "./lib/components");
const componentsTargetDir = path.join(targetDir, "/template");

function copyStyles() {
  for (const file of globbySync("**/*.scss", { cwd: stylesSourceDir })) {
    const content = fs.readFileSync(path.join(stylesSourceDir, file), "utf-8");
    fs.mkdirSync(path.join(stylesTargetDir, path.dirname(file)), { recursive: true });
    fs.writeFileSync(
      path.join(stylesTargetDir, file),
      content.replace(
        /@use "(\.\.\/)+node_modules\/@cloudscape-design\/design-tokens\/index.scss"/,
        '@use "awsui:tokens"'
      ),
      "utf-8"
    );
  }
}

function copyTemplate() {
  fs.mkdirSync(componentsTargetDir, { recursive: true });
  fs.cpSync(componentsSourceDir, componentsTargetDir, { recursive: true });
}

copyTemplate();
copyStyles();
