// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { generateGrid } from "./generators";
import { runRemoveAndRefloat } from "./helpers";

test("element removal never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const { transition } = runRemoveAndRefloat(grid, "A");
    expect(transition.blocks).toHaveLength(0);
  });
});

describe("remove scenarios", () => {
  test.each([
    [
      "remove X forcing other items to float",
      [
        [" ", "X", "C"],
        ["A", "A", " "],
        ["E", "D", "D"],
      ],
      "X",
      [
        ["A", "A", "C"],
        ["E", "D", "D"],
      ],
    ],
  ])("%s", (_, ...inputs) => {
    const { result, expectation } = runRemoveAndRefloat(...inputs);
    expect(result).toBe(expectation);
  });
});
