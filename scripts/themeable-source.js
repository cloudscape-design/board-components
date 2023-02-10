// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execaSync } from "execa";
const cwd = process.cwd();

const targetDir = path.join(cwd, "./lib/components-themeable");
const internalDir = path.join(targetDir, "internal");

const stylesSourceDir = path.join(cwd, "./src/");
const stylesTargetDir = path.join(internalDir, "/scss");

const componentsSourceDir = path.join(cwd, "./lib/components");
const componentsTargetDir = path.join(internalDir, "/template");

function copyStyles() {
  fs.mkdirSync(stylesTargetDir, { recursive: true });
  execaSync("rsync", [
    "--prune-empty-dirs",
    "-a",
    "--include",
    "*/",
    "--include",
    "*.scss",
    "--exclude",
    "*",
    stylesSourceDir,
    stylesTargetDir,
  ]);
}

function copyTemplate() {
  fs.mkdirSync(componentsTargetDir, { recursive: true });
  fs.cpSync(componentsSourceDir, componentsTargetDir, { recursive: true });
}

copyTemplate();
copyStyles();
