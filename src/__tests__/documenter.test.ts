// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";
import { getAllComponents, requireComponentDefinition } from "./utils";

test.each<string>(getAllComponents())(`definition for %s matches the snapshot`, (componentName: string) => {
  const definition = requireComponentDefinition(componentName);
  expect(definition).toMatchSnapshot(componentName);
});
