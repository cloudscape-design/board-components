// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, generateResize, toString } from "../debug-tools";
import { withCommit } from "./helpers";

test("decrease in element size never creates conflicts", () => {
  range(0, 10).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, { maxWidthIncrement: 0, maxHeightIncrement: 0 });
    const transition = withCommit(grid, (engine) => engine.resize(resize));
    expect(transition.moves.filter((move) => move.type !== "FLOAT")).toHaveLength(0);
  });
});

test("elements resize never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const resize = generateResize(grid, { maxWidthDecrement: 0, maxHeightDecrement: 0 });
    const transition = withCommit(grid, (engine) => engine.resize(resize));
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
  ])("%s", (_, gridMatrix, resize, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = withCommit(grid, (engine) => engine.resize(resize));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});
