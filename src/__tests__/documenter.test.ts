// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test } from "vitest";

import apiDocs from "../../lib/components/internal/api-docs/components";

test.each(Object.entries(apiDocs))("definition for $0 matches the snapshot", (name, definition) => {
  expect(definition).toMatchSnapshot();
});
