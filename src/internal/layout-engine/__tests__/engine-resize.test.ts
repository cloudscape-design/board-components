// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, generateRandomPath, generateResize, toString } from "../../debug-tools";
import { Position } from "../../utils/position";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("decrease in element size never creates conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid, { maxWidthIncrement: 0, maxHeightIncrement: 0 });
    const layoutShift = new LayoutEngine(grid).resize(resize);
    expect(layoutShift.moves.filter((move) => move.type !== "FLOAT" && move.type !== "RESIZE")).toHaveLength(0);
  });
});

test("elements resize never leaves grid with unresolved conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid, { maxWidthDecrement: 0, maxHeightDecrement: 0 });
    const layoutShift = new LayoutEngine(grid).resize(resize);
    expect(layoutShift.conflicts).toHaveLength(0);
  });
});

test("commits no changes if resize path returns to original or smaller", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const resize = generateResize(grid, { maxWidthDecrement: 0, maxHeightDecrement: 0 });
    if (resize.path.length > 0) {
      const lastPathItem = resize.path[resize.path.length - 1];
      const resizeTarget = grid.items.find((it) => it.id === resize.itemId)!;
      const originalSizePath = new Position({
        x: randomPathValue(resizeTarget.x + resizeTarget.width),
        y: randomPathValue(resizeTarget.y + resizeTarget.height),
      });
      resize.path = [...resize.path, ...generateRandomPath(lastPathItem, originalSizePath)];
      const moves = new LayoutEngine(grid).resize(resize).moves;
      expect(moves.filter((move) => move.type !== "RESIZE" && move.type !== "FLOAT")).toHaveLength(0);
    }
  });

  function randomPathValue(max: number) {
    return Math.floor(Math.random() * max) + 1;
  }
});

describe("resize scenarios", () => {
  test.each([
    [
      "resize A 2:1 -> 2:2",
      [
        ["A", "B", " "],
        ["D", "C", " "],
        [" ", " ", " "],
      ],
      {
        itemId: "A",
        path: [new Position({ x: 2, y: 1 }), new Position({ x: 2, y: 2 })],
      },
      [
        ["A", "A", "B"],
        ["A", "A", " "],
        ["D", "C", " "],
      ],
    ],
    [
      "resize A 1:2 -> 2:2",
      [
        ["A", "B", " "],
        ["D", "C", " "],
        [" ", " ", " "],
      ],
      {
        itemId: "A",
        path: [new Position({ x: 1, y: 2 }), new Position({ x: 2, y: 2 })],
      },
      [
        ["A", "A", "B"],
        ["A", "A", "C"],
        ["D", " ", " "],
      ],
    ],
    [
      "resize A to 3:1",
      [
        ["A", "A", "F"],
        ["A", "A", "E"],
        ["B", "C", "D"],
      ],
      {
        itemId: "A",
        path: [new Position({ x: 3, y: 2 }), new Position({ x: 3, y: 1 })],
      },
      [
        ["A", "A", "A"],
        ["B", "C", "F"],
        [" ", " ", "E"],
        [" ", " ", "D"],
      ],
    ],
    [
      "resize A to 3:3",
      [
        ["A", "A", "F"],
        ["A", "A", "E"],
        ["B", "C", "D"],
      ],
      {
        itemId: "A",
        path: [new Position({ x: 3, y: 2 }), new Position({ x: 3, y: 3 })],
      },
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "F"],
        [" ", " ", "E"],
        [" ", " ", "D"],
      ],
    ],
    [
      "resize B to 4:2",
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
      { itemId: "B", path: [new Position({ x: 4, y: 3 })] },
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
    ],
    [
      "resize B to 4:3",
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
      {
        itemId: "B",
        path: [new Position({ x: 4, y: 3 }), new Position({ x: 4, y: 4 })],
      },
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["B", "B", "B", "B"],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
    ],
    [
      "resize A to 3:3",
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
      {
        itemId: "A",
        path: [new Position({ x: 3, y: 2 }), new Position({ x: 3, y: 3 })],
      },
      [
        ["A", "A", "A", " "],
        ["A", "A", "A", " "],
        ["A", "A", "A", " "],
        ["B", "B", "B", "B"],
        ["C", "D", "D", "E"],
        ["C", "F", "F", "F"],
      ],
    ],
    [
      "resize B to 1:2",
      [
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["I", "J", "K", "L"],
        ["M", "N", "O", "P"],
      ],
      {
        itemId: "B",
        path: [new Position({ x: 2, y: 2 })],
      },
      [
        ["A", "B", "C", "D"],
        ["E", "B", "G", "H"],
        ["I", "F", "K", "L"],
        ["M", "J", "O", "P"],
        [" ", "N", " ", " "],
      ],
    ],
  ])("%s", (_, gridMatrix, resize, expectation) => {
    const layoutShift = new LayoutEngine(fromMatrix(gridMatrix)).resize(resize);
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
