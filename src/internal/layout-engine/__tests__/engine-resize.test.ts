// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, generateResize, toString } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("decrease in element size never creates conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid, { maxWidthIncrement: 0, maxHeightIncrement: 0 });
    const layoutShift = new LayoutEngine(grid).resize(resize).refloat().getLayoutShift();
    expect(layoutShift.moves.filter((move) => move.type !== "FLOAT")).toHaveLength(0);
  });
});

test("elements resize never leaves grid with unresolved conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid, { maxWidthDecrement: 0, maxHeightDecrement: 0 });
    const layoutShift = new LayoutEngine(grid).resize(resize).refloat().getLayoutShift();
    expect(layoutShift.conflicts).toHaveLength(0);
  });
});

test("elements resize never issues escape moves", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid);
    const layoutShift = new LayoutEngine(grid).resize(resize).refloat().getLayoutShift();
    expect(layoutShift.moves.filter((move) => move.type === "ESCAPE")).toHaveLength(0);
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
    [
      "resize B to 4:2",
      [
        ["A", "A", "A", "A"],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
      { itemId: "B", width: 4, height: 2 },
      [
        ["A", "A", "A", "A"],
        ["B", "B", "B", "B"],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
    ],
  ])("%s", (_, gridMatrix, resize, expectation) => {
    const layoutShift = new LayoutEngine(fromMatrix(gridMatrix)).resize(resize).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});