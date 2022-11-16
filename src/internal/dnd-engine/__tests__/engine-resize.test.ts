// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { applyResize } from "../engine";
import { createResizeTestSuite, createTextGrid, generateGrid, generateResize, stringifyTextGrid } from "./helpers";

test("decrease in element size never issues other element movements", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, 0, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1);

    const transition = applyResize(grid, resize);

    expect(transition.moves).toHaveLength(0);
  });
});

test("elements resize never leave grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1, 0);

    const transition = applyResize(grid, resize);
    const textGrid = createTextGrid(transition.end);

    expect(stringifyTextGrid(textGrid)).not.toContain("/");
  });
});

describe("resize scenarios", () => {
  test.each([
    createResizeTestSuite(
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
      ]
    ),
    createResizeTestSuite(
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
      ]
    ),
  ])("%s", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});
