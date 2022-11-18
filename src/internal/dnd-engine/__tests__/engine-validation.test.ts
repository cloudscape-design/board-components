// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { DndEngine } from "../engine";
import { GridTransition } from "../interfaces";
import { createTextGrid, parseTextGrid, stringifyTextGrid } from "./helpers";

test("throws if grid definition is not valid", () => {
  let grid = parseTextGrid([
    ["A", "B", "C", " "],
    ["D", " ", "F", "X"],
    ["G", "E", "E", " "],
  ]);
  grid.width = 3;
  expect(() => new DndEngine(grid)).toThrowError("Invalid grid: items outside the boundaries.");

  grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F/X"],
    ["G", "E", "E"],
  ]);
  expect(() => new DndEngine(grid)).toThrowError("Invalid grid: items overlap.");

  grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);
  grid.items[0].width = 0;
  expect(() => new DndEngine(grid)).toThrowError("Invalid grid: items of invalid size.");
});

test("throws if move command is not valid", () => {
  const grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new DndEngine(grid).move({ itemId: "X", path: [{ x: 0, y: 0 }] })).toThrowError(
    'Item with id "X" not found in the grid.'
  );
  expect(() => new DndEngine(grid).move({ itemId: "F", path: [{ x: 3, y: 1 }] })).toThrowError(
    "Invalid move: outside grid."
  );
  expect(() => new DndEngine(grid).move({ itemId: "D", path: [{ x: 2, y: 1 }] })).toThrowError(
    "Invalid move: must move one step at a time."
  );
});

test("throws if resize command is not valid", () => {
  const grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new DndEngine(grid).resize({ itemId: "X", width: 1, height: 1 })).toThrowError(
    'Item with id "X" not found in the grid.'
  );
});

test("throws if insert command is not valid", () => {
  const grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", " ", " "],
  ]);

  expect(() => new DndEngine(grid).insert({ id: "X", x: 2, y: 2, width: 2, height: 1 })).toThrowError(
    "Inserting item is outside the boundaries."
  );
  expect(() => new DndEngine(grid).insert({ id: "X", x: 1, y: 1, width: 2, height: 0 })).toThrowError(
    "Inserting item has invalid size."
  );
});

test("throws if remove command is not valid", () => {
  const grid = parseTextGrid([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new DndEngine(grid).remove("X")).toThrowError('Item with id "X" not found in the grid.');
});

test("normalizes move path when returning to start location", () => {
  const grid = parseTextGrid([
    ["A", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const transition = new DndEngine(grid).move({
    itemId: "A",
    path: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
    ],
  });
  expect(transition.moves).toHaveLength(0);
});

test("normalizes move path when returning to previously visited item", () => {
  const grid = parseTextGrid([
    ["A", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const transition = new DndEngine(grid).move({
    itemId: "A",
    path: [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
      { x: 1, y: 0 },
    ],
  });
  expect(transition.moves).toHaveLength(1);
});

test("normalizes resize dimensions when below 1", () => {
  expect(
    printResult(
      new DndEngine(
        parseTextGrid([
          ["A", "A"],
          ["A", "A"],
        ])
      ).resize({ itemId: "A", width: 0, height: -1 })
    )
  ).toBe(stringifyTextGrid([["A", " "]]));
});

test("normalizes resize dimensions when outside grid", () => {
  expect(
    printResult(
      new DndEngine(
        parseTextGrid([
          [" ", "A", " "],
          [" ", "A", " "],
          [" ", " ", " "],
        ])
      ).resize({ itemId: "A", width: 3, height: 3 })
    )
  ).toBe(
    stringifyTextGrid([
      [" ", "A", "A"],
      [" ", "A", "A"],
      [" ", "A", "A"],
    ])
  );
});

function printResult(transition: GridTransition): string {
  return stringifyTextGrid(createTextGrid(transition.end));
}
