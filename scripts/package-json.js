// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import fs from "node:fs";
import { writeJSON } from "./utils.js";

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));

mainPackage();
themablePackage();

function mainPackage() {
  writeJSON("lib/components/package.json", {
    ...pkg,
    // prevent postinstall scripts we use in our build from being published
    scripts: undefined,
  });
}

function themablePackage() {
  writeJSON("lib/components-themeable/package.json", {
    name: "@cloudscape-design/board-components-themeable",
    version: pkg.version,
    repository: pkg.repository,
    homepage: pkg.homepage,
  });
}
