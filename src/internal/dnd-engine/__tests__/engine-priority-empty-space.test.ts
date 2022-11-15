// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { createMoveTestSuite } from "./helpers";

/*
  The below tests validate that empty spaces are preferred over occupied when resolving conflicts.
*/

test.each([
  createMoveTestSuite(
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
    ]
  ),
  createMoveTestSuite(
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
    ]
  ),
  createMoveTestSuite(
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
    ]
  ),
  createMoveTestSuite(
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
    ]
  ),
])("%s", (_, run) => {
  const { result, expectation } = run();
  expect(result).toBe(expectation);
});
