// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, generateInsert, toString } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("element insertion never leaves grid with unresolved conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const item = generateInsert(grid);
    const layoutShift = new LayoutEngine(grid).insert(item).getLayoutShift();
    expect(layoutShift.conflicts).toHaveLength(0);
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
  ])("%s", (_, grid, item, expectation) => {
    const layoutShift = new LayoutEngine(fromMatrix(grid)).insert(item).getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
