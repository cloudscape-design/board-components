// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { generateGrid, generateResize } from "./generators";
import { runResizeAndRefloat } from "./helpers";

test("decrease in element size never creates conflicts", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, 0, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1);
    const { transition } = runResizeAndRefloat(grid, resize);
    expect(transition.moves.filter((move) => move.type !== "FLOAT")).toHaveLength(0);
  });
});

test("elements resize never leave grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, grid.width - 1, 0, Math.floor((grid.items.length - 1) % 2) + 1, 0);
    const { transition } = runResizeAndRefloat(grid, resize);
    expect(transition.blocks).toHaveLength(0);
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
  ])("%s", (_, ...inputs) => {
    const { result, expectation } = runResizeAndRefloat(...inputs);
    expect(result).toBe(expectation);
  });
});
