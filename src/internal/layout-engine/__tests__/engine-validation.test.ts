// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from "vitest";
import { fromMatrix, fromTextPath } from "../../debug-tools";
import { LayoutEngine } from "../engine";

test("throws if grid definition is not valid", () => {
  let grid = fromMatrix([
    ["A", "B", "C", " "],
    ["D", " ", "F", "X"],
    ["G", "E", "E", " "],
  ]);
  grid.columns = 3;
  expect(() => new LayoutEngine(grid)).toThrowError("Invalid grid: items outside the boundaries.");

  grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F/X"],
    ["G", "E", "E"],
  ]);
  expect(() => new LayoutEngine(grid)).toThrowError("Invalid grid: items overlap.");

  grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);
  grid.items[0].width = 0;
  expect(() => new LayoutEngine(grid)).toThrowError("Invalid grid: items of invalid size.");
});

test("throws if move command is not valid", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new LayoutEngine(grid).move({ itemId: "X", path: [{ x: 0, y: 0 }] })).toThrowError(
    'Item with id "X" not found in the grid.'
  );
  expect(() => new LayoutEngine(grid).move({ itemId: "F", path: [{ x: 3, y: 1 }] })).toThrowError(
    "Invalid move: outside grid."
  );
});

test("throws if resize command is not valid", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new LayoutEngine(grid).resize({ itemId: "X", path: [{ x: 1, y: 1 }] })).toThrowError(
    'Item with id "X" not found in the grid.'
  );

  expect(() =>
    new LayoutEngine(
      fromMatrix([
        ["A", "A"],
        ["A", "A"],
      ])
    ).resize({
      itemId: "A",
      path: [
        { x: 1, y: 2 },
        { x: 0, y: 2 },
      ],
    })
  ).toThrowError("Invalid resize: can't resize to 0.");

  expect(() =>
    new LayoutEngine(
      fromMatrix([
        ["A", "A"],
        ["A", "A"],
      ])
    ).resize({
      itemId: "A",
      path: [
        { x: 2, y: 1 },
        { x: 2, y: 0 },
      ],
    })
  ).toThrowError("Invalid resize: can't resize to 0.");

  expect(() =>
    new LayoutEngine(
      fromMatrix([
        ["A", "A"],
        ["A", "A"],
      ])
    ).resize({ itemId: "A", path: [{ x: 3, y: 2 }] })
  ).toThrowError("Invalid resize: outside grid.");
});

test("throws if insert command is not valid", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", " ", " "],
  ]);

  expect(() => new LayoutEngine(grid).insert({ id: "X", x: 2, y: 2, width: 2, height: 1 })).toThrowError(
    "Inserting item is outside the boundaries."
  );
  expect(() => new LayoutEngine(grid).insert({ id: "X", x: 1, y: 1, width: 2, height: 0 })).toThrowError(
    "Inserting item has invalid size."
  );
});

test("throws if remove command is not valid", () => {
  const grid = fromMatrix([
    ["A", "B", "C"],
    ["D", " ", "F"],
    ["G", "E", "E"],
  ]);

  expect(() => new LayoutEngine(grid).remove("X")).toThrowError('Item with id "X" not found in the grid.');
});

test("normalizes move path when returning to start location", () => {
  const grid = fromMatrix([
    ["A", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("A1 B1 B2 A2 A1", grid)).getLayoutShift();
  expect(layoutShift.moves).toHaveLength(0);
});

test("normalizes move path when returning to previously visited item", () => {
  const grid = fromMatrix([
    ["A", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("A1 B1 B2 C2 C1 B1", grid)).getLayoutShift();
  expect(layoutShift.moves).toHaveLength(1);
});

test("normalizes move path and continues when from the repeating position", () => {
  const grid = fromMatrix([[" ", "A", " "]]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("B1 B2 B3 B2 B3 B4", grid)).getLayoutShift();
  expect(layoutShift.moves).toEqual([
    { itemId: "A", x: 1, y: 1, width: 1, height: 1, type: "USER" },
    { itemId: "A", x: 1, y: 2, width: 1, height: 1, type: "USER" },
    { itemId: "A", x: 1, y: 3, width: 1, height: 1, type: "USER" },
  ]);
});

test("normalizes move path when it has missing steps", () => {
  const grid = fromMatrix([
    ["A", " ", " "],
    [" ", " ", " "],
    [" ", " ", " "],
  ]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("A1 B2", grid)).getLayoutShift();
  expect(layoutShift.moves).toEqual([
    { itemId: "A", x: 1, y: 0, width: 1, height: 1, type: "USER" },
    { itemId: "A", x: 1, y: 1, width: 1, height: 1, type: "USER" },
  ]);
});
