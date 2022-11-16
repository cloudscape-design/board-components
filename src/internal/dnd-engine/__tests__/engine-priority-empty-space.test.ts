// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { createMoveTestSuite } from "./helpers";

test.each([
  [
    "E pushes C to the bottom",
    [
      ["A", "B", "C"],
      ["D", "E", "C"],
      [" ", "F", " "],
      [" ", "F", " "],
    ],
    "B2 C2",
    [
      ["A", "B", "E"],
      ["D", "F", "C"],
      [" ", "F", "C"],
    ],
  ],
  [
    "A pushes D to the bottom creating new line",
    [
      ["D", "A"],
      ["D", "F"],
    ],
    "B1 A1",
    [
      ["A", "F"],
      ["D", " "],
      ["D", " "],
    ],
  ],
  [
    "E pushes F to the right",
    [
      ["A", "B", "C", "C"],
      ["D", "E", "F", " "],
      ["G", "G", "F", " "],
      ["H", "H", "H", " "],
    ],
    "B2 C2",
    [
      ["A", "B", "C", "C"],
      ["D", " ", "E", "F"],
      ["G", "G", " ", "F"],
      ["H", "H", "H", " "],
    ],
  ],
  [
    "G pushes E to the left",
    [
      ["A", "B", "C"],
      [" ", "E", "C"],
      [" ", "E", "G"],
      [" ", "E", "G"],
      [" ", "F", "F"],
    ],
    "C3 B3",
    [
      ["A", "B", "C"],
      ["E", "G", "C"],
      ["E", "G", " "],
      ["E", "F", "F"],
    ],
  ],
])("$s", (_, ...inputs) => {
  const { run, expectation } = createMoveTestSuite(...inputs);
  expect(run().result).toBe(expectation);
});
