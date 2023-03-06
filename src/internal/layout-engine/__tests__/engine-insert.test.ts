// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, generateInsert, toString } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("element insertion never leaves grid with unresolved conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const insert = generateInsert(grid);
    const layoutShift = new LayoutEngine(grid).insert(insert).getLayoutShift();
    expect(layoutShift.conflicts).toHaveLength(0);
  });
});

describe("insert scenarios", () => {
  test.each([
    [
      "Inserting X to a vacant slot",
      [
        [" ", "B", "C"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
      { itemId: "X", width: 1, height: 1, path: [{ x: 0, y: 0 }] },
      [
        ["X", "B", "C"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
    ],
    [
      "Inserting X forces a conflict",
      [
        ["A", "A", "B"],
        ["A", "A", "D"],
        ["E", "E", "D"],
      ],
      { itemId: "X", width: 2, height: 2, path: [{ x: 1, y: 1 }] },
      [
        [" ", " ", "B"],
        [" ", "X", "X"],
        [" ", "X", "X"],
        ["A", "A", "D"],
        ["A", "A", "D"],
        ["E", "E", " "],
      ],
    ],
    [
      "Inserting X forcing all items to move down in 2-column layout",
      [
        ["A", "A"],
        ["A", "A"],
        ["B", "B"],
        ["B", "B"],
        ["C", "C"],
        ["C", "C"],
        ["C", "C"],
        ["C", "C"],
      ],
      { itemId: "X", width: 2, height: 4, path: [{ x: 0, y: 0 }] },
      [
        ["X", "X"],
        ["X", "X"],
        ["X", "X"],
        ["X", "X"],
        ["A", "A"],
        ["A", "A"],
        ["B", "B"],
        ["B", "B"],
        ["C", "C"],
        ["C", "C"],
        ["C", "C"],
        ["C", "C"],
      ],
    ],
  ])("%s", (_, grid, item, expectation) => {
    const layoutShift = new LayoutEngine(fromMatrix(grid)).insert(item).getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
