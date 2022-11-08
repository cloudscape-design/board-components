// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ThemeBuilder, buildThemedComponentsInternal } from "@cloudscape-design/theming-build";

await buildThemedComponentsInternal({
  primary: new ThemeBuilder("unused", ":root", []).build(),
  componentsOutputDir: "lib/components",
  skip: ["design-tokens", "preset"],
  scssDir: "src",
  variablesMap: {},
  exposed: [],
});
