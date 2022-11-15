// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { expect, test } from "vitest";
import { applyMove, refloatGrid } from "../engine";
import { Item } from "../interfaces";
import { createTextGrid, generateGrid, generateMovePath, parseTextGrid, stringifyTextGrid } from "./helpers";

test("all items float to the top after move", () => {
  range(0, 100).forEach(() => {
    const grid = generateGrid();
    const movePath = generateMovePath(grid, "any");
    const transition = refloatGrid(applyMove(grid, movePath).end);
    const textGrid = createTextGrid(transition.end);

    let invalid: null | Item = null;
    for (const item of transition.end.items) {
      invalid = item;

      for (let x = item.x; x < item.x + item.width; x++) {
        if (item.y === 0 || textGrid[item.y - 1][x] !== " ") {
          invalid = null;
          break;
        }
      }

      if (invalid) {
        break;
      }
    }

    const hasUnresolved = stringifyTextGrid(textGrid).includes("/");
    if (!hasUnresolved) {
      expect(invalid, `Expected item "${invalid?.id}" to float.`).toBe(null);
    }
  });
});

test("float creates addition moves", () => {
  const grid = parseTextGrid([
    ["A", "B", "C", "D"],
    [" ", " ", "E", "E"],
    [" ", " ", "F", "G"],
    [" ", " ", "H", " "],
  ]);
  const movePath = {
    itemId: "E",
    path: [
      { y: 1, x: 1 },
      { y: 1, x: 0 },
    ],
  };
  const applyTransition = applyMove(grid, movePath);
  const refloatTransition = refloatGrid(applyTransition.end);
  const moves = [...applyTransition.moves, ...refloatTransition.moves];
  expect(moves).toEqual([
    { itemId: "E", y: 1, x: 1, type: "USER" },
    { itemId: "E", y: 1, x: 0, type: "USER" },
    { itemId: "F", y: 1, x: 2, type: "FLOAT" },
    { itemId: "G", y: 1, x: 3, type: "FLOAT" },
    { itemId: "H", y: 2, x: 2, type: "FLOAT" },
  ]);
});
