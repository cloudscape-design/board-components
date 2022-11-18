// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, fromTextPath, generateGrid, generateMove, toMatrix } from "../debug-tools";
import { forEachTimes, withCommit } from "./helpers";

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
      const transition = withCommit(grid, (engine) => engine.move(movePath));

      if (transition.blocks.length === 0) {
        const textGrid = toMatrix(transition.end);

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
  const transition = withCommit(grid, (engine) => engine.move(fromTextPath("C2 B2 A2", grid)));

  expect(transition.moves).toEqual([
    { itemId: "E", y: 1, x: 1, type: "USER" },
    { itemId: "E", y: 1, x: 0, type: "USER" },
    { itemId: "F", y: 1, x: 2, type: "FLOAT" },
    { itemId: "G", y: 1, x: 3, type: "FLOAT" },
    { itemId: "H", y: 2, x: 2, type: "FLOAT" },
  ]);
});
