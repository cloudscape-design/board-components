// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, fromTextPath, generateGrid, generateMove, toMatrix } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("all items float to the top after move+commit", () => {
  forEachTimes(
    33,
    [
      [4, 10],
      [5, 15],
      [6, 20],
    ],
    ([width, totalItems]) => {
      const grid = generateGrid({ width, totalItems });
      const movePath = generateMove(grid, "any");
      const layoutShift = new LayoutEngine(grid).move(movePath).refloat().getLayoutShift();

      if (layoutShift.conflicts.length === 0) {
        const textGrid = toMatrix(layoutShift.next);

        let invalidItem: null | string = null;
        for (const item of layoutShift.next.items) {
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
    }
  );
});

test("float creates addition moves", () => {
  const grid = fromMatrix([
    ["A", "B", "C", "D"],
    [" ", " ", "E", "E"],
    [" ", " ", "F", "G"],
    [" ", " ", "H", " "],
  ]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("C2 B2 A2", grid)).refloat().getLayoutShift();
  expect(layoutShift.moves).toEqual([
    { itemId: "E", y: 1, x: 1, width: 2, height: 1, type: "MOVE" },
    { itemId: "G", y: 1, x: 3, width: 1, height: 1, type: "FLOAT" },
    { itemId: "E", y: 1, x: 0, width: 2, height: 1, type: "MOVE" },
    { itemId: "F", y: 1, x: 2, width: 1, height: 1, type: "FLOAT" },
    { itemId: "H", y: 2, x: 2, width: 1, height: 1, type: "FLOAT" },
  ]);
});
