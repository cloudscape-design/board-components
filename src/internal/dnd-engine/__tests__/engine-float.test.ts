// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { generateGrid, generateMovePath } from "./generators";
import { createTextGrid, forEachTimes, runMoveAndRefloat } from "./helpers";

test("all items float to the top after move", () => {
  forEachTimes(33, [generateGrid(4, 10), generateGrid(5, 15), generateGrid(6, 20)], (grid) => {
    const movePath = generateMovePath(grid, "any");
    const { transition } = runMoveAndRefloat(grid, movePath);

    if (transition.blocks.length === 0) {
      const textGrid = createTextGrid(transition.end);

      let invalidItem: null | string = null;
      for (const item of transition.end.items) {
        invalidItem = item.id;

        for (let x = item.x; x < item.x + item.width; x++) {
          if (item.y === 0 || textGrid[item.y - 1][x] !== " ") {
            invalidItem = null;
            break;
          }
        }

        if (invalidItem) {
          break;
        }
      }

      expect(invalidItem, `Expected item "${invalidItem}" to float.`).toBe(null);
    }
  });
});

test("float creates addition moves", () => {
  const { transition } = runMoveAndRefloat(
    [
      ["A", "B", "C", "D"],
      [" ", " ", "E", "E"],
      [" ", " ", "F", "G"],
      [" ", " ", "H", " "],
    ],
    "C2 B2 A2"
  );
  expect(transition.moves).toEqual([
    { itemId: "E", y: 1, x: 1, type: "USER" },
    { itemId: "E", y: 1, x: 0, type: "USER" },
    { itemId: "F", y: 1, x: 2, type: "FLOAT" },
    { itemId: "G", y: 1, x: 3, type: "FLOAT" },
    { itemId: "H", y: 2, x: 2, type: "FLOAT" },
  ]);
});
