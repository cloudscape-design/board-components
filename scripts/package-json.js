// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from "node:fs";
import { writeSourceFile } from "./utils.js";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

mainPackage();

function mainPackage() {
  writeJSON("lib/components/package.json", {
    ...pkg,
    // prevent postinstall scripts we use in our build from being published
    scripts: undefined,
  });
}

function writeJSON(path, content) {
  writeSourceFile(path, JSON.stringify(content, null, 2) + "\n");
}
