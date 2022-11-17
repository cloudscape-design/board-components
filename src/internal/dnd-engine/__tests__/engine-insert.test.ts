// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { generateGrid, generateInsert } from "./generators";
import { runInsertAndRefloat } from "./helpers";

test("element insertion never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const item = generateInsert(grid);
    const { transition } = runInsertAndRefloat(grid, item);
    expect(transition.blocks).toHaveLength(0);
  });
});

describe("insert scenarios", () => {
  test.each([
    [
      "Insert X to a vacant slot",
      [
        [" ", "B", "C"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
      { id: "X", x: 0, y: 0, width: 1, height: 1 },
      [
        ["X", "B", "C"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
    ],
    [
      "Insert X forcing a conflict",
      [
        ["A", "A", "B"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
      { id: "X", x: 1, y: 1, width: 2, height: 2 },
      [
        [" ", " ", "B"],
        [" ", "X", "X"],
        [" ", "X", "X"],
        ["E", "E", "D"],
        ["A", "A", "D"],
        ["A", "A", " "],
      ],
    ],
  ])("%s", (_, ...inputs) => {
    const { result, expectation } = runInsertAndRefloat(...inputs);
    expect(result).toBe(expectation);
  });
});
