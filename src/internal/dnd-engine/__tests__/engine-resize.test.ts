// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { DndEngine } from "../engine";
import { generateGrid, generateResize } from "./generators";

test("decrease in element size never creates conflicts", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, { maxWidthIncrement: 0, maxHeightIncrement: 0 });
    const layoutShift = new DndEngine(grid).resize(resize).refloat().getLayoutShift();
    expect(layoutShift.moves.filter((move) => move.type !== "FLOAT")).toHaveLength(0);
  });
});

test("elements resize never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, { maxWidthDecrement: 0, maxHeightDecrement: 0 });
    const layoutShift = new DndEngine(grid).resize(resize).refloat().getLayoutShift();
    expect(layoutShift.conflicts).toHaveLength(0);
  });
});

describe("resize scenarios", () => {
  test.each([
    [
      "resize A to 3:1",
      [
        ["A", "A", "F"],
        ["A", "A", "E"],
        ["B", "C", "D"],
      ],
      { itemId: "A", width: 3, height: 1 },
      [
        ["A", "A", "A"],
        ["B", "E", "F"],
        [" ", "C", "D"],
      ],
    ],
    [
      "resize A to 3:3",
      [
        ["A", "A", "F"],
        ["A", "A", "E"],
        ["B", "C", "D"],
      ],
      { itemId: "A", width: 3, height: 3 },
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "D"],
        [" ", " ", "F"],
        [" ", " ", "E"],
      ],
    ],
  ])("%s", (_, gridMatrix, resize, expectation) => {
    const layoutShift = new DndEngine(fromMatrix(gridMatrix)).resize(resize).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
