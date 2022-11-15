// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { createMoveTestSuite } from "./helpers";

/*
  The below tests excersise long-path transitions.
*/

test.each([
  createMoveTestSuite(
    "A travels to bottom-right corner",
    [
      ["A", "F", "F", "F"],
      ["E", "D", "K", "R"],
      ["B", "B", "B", "M"],
      ["B", "B", "B", "M"],
      ["C", "C", "S", "G"],
    ],
    "A1 A2 B2 C2 D2 D3 D4 D5 C5 B5 A5",
    [
      ["E", "F", "F", "F"],
      ["D", "K", "R", "M"],
      ["B", "B", "B", "M"],
      ["B", "B", "B", "G"],
      ["A", "C", "C", "S"],
    ]
  ),
])("%s", (_, run) => {
  const { result, expectation } = run();
  expect(result).toBe(expectation);
});
