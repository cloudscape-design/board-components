// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, fromTextPath, generateGrid, generateMove, toString } from "../debug-tools";
import { DndEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("any move on a grid with 1x1 items only is resolved", () => {
  forEachTimes(
    33,
    [
      [4, 10, 1, 1],
      [5, 15, 1, 1],
      [6, 20, 1, 1],
    ],
    ([width, totalItems, averageItemWidth, averageItemHeight]) => {
      const grid = generateGrid({ width, totalItems, averageItemWidth, averageItemHeight });
      const movePath = generateMove(grid, "any");
      const transition = new DndEngine(grid).move(movePath);
      expect(transition.conflicts.length).toBe(0);
    }
  );
});

test("all vertical moves are resolved if all items have height=1", () => {
  forEachTimes(
    33,
    [
      [4, 10, 1.5, 1],
      [5, 15, 1.5, 1],
      [6, 20, 1.5, 1],
    ],
    ([width, totalItems, averageItemWidth, averageItemHeight]) => {
      const grid = generateGrid({ width, totalItems, averageItemWidth, averageItemHeight });
      const movePath = generateMove(grid, "vertical");
      const transition = new DndEngine(grid).move(movePath);
      expect(transition.conflicts.length).toBe(0);
    }
  );
});

test("all vertical moves are resolved if all items have width=1", () => {
  forEachTimes(
    33,
    [
      [4, 10, 1, 1.5],
      [5, 15, 1, 1.5],
      [6, 20, 1, 1.5],
    ],
    ([width, totalItems, averageItemWidth, averageItemHeight]) => {
      const grid = generateGrid({ width, totalItems, averageItemWidth, averageItemHeight });
      const movePath = generateMove(grid, "horizontal");
      const transition = new DndEngine(grid).move(movePath);
      expect(transition.conflicts.length).toBe(0);
    }
  );
});

describe("swap right", () => {
  test.each([
    [[["A", "B", "B"]], "A1 B1", [[" ", "A/B", "B"]]],
    [[["A", "B", "B", "B"]], "A1 B1", [[" ", "A/B", "B", "B"]]],
    [[["A", "B", "B", "B"]], "A1 B1 C1", [[" ", "B", "A/B", "B"]]],
    [[["A", "A", "B", "B"]], "A1 B1", [[" ", "A", "A/B", "B"]]],
    [[["A", "A", "B", "B", "B"]], "A1 B1", [[" ", "A", "A/B", "B", "B"]]],
    [[["A", "A", "B", "B", "B"]], "A1 B1 C1", [[" ", " ", "A/B", "A/B", "B"]]],
  ])("can't swap to the right when not enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A", "B", "B"]], "A1 B1 C1", [["B", "B", "A"]]],
    [[["A", "B", "B", "B"]], "A1 B1 C1 D1", [["B", "B", "B", "A"]]],
    [[["A", "A", "B", "B"]], "A1 B1 C1", [["B", "B", "A", "A"]]],
    [[["A", "A", "B", "B", "B"]], "A1 B1 C1 D1", [["B", "B", "B", "A", "A"]]],
  ])("can swap to the right when enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A", "B", "C", "C"]], "A1 B1 C1", [["B", " ", "A/C", "C"]]],
    [
      [
        ["A", "B", "C", " "],
        ["A", "E", "D", "D"],
      ],
      "A1 B1 C1",
      [
        ["B", "C", "A", " "],
        ["E", " ", "A/D", "D"],
      ],
    ],
  ])("can make partial swap to the right", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});

describe("swap left", () => {
  test.each([
    [[["A", "A", "B"]], "C1 B1", [["A", "A/B", " "]]],
    [[["A", "A", "A", "B"]], "D1 C1", [["A", "A", "A/B", " "]]],
    [[["A", "A", "A", "B"]], "D1 C1 B1", [["A", "A/B", "A", " "]]],
    [[["A", "A", "B", "B"]], "C1 B1", [["A", "A/B", "B", " "]]],
    [[["A", "A", "A", "B", "B"]], "D1 C1", [["A", "A", "A/B", "B", " "]]],
    [[["A", "A", "A", "B", "B"]], "D1 C1 B1", [["A", "A/B", "A/B", " ", " "]]],
  ])("can't swap to the left when not enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A", "A", "B"]], "C1 B1 A1", [["B", "A", "A"]]],
    [[["A", "A", "A", "B"]], "D1 C1 B1 A1", [["B", "A", "A", "A"]]],
    [[["A", "A", "B", "B"]], "C1 B1 A1", [["B", "B", "A", "A"]]],
    [[["A", "A", "A", "B", "B"]], "D1 C1 B1 A1", [["B", "B", "A", "A", "A"]]],
  ])("can swap to the left when enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["C", "C", "B", "A"]], "D1 C1 B1", [["C", "A/C", " ", "B"]]],
    [
      [
        ["C", "C", "B", "A"],
        [" ", " ", "E", "A"],
      ],
      "D1 C1 B1",
      [
        ["C", "A/C", " ", "B"],
        [" ", "A", " ", "E"],
      ],
    ],
  ])("can make partial swap to the left", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});

describe("swap bottom", () => {
  test.each([
    [[["A"], ["B"], ["B"]], "A1 A2", [[" "], ["A/B"], ["B"]]],
    [[["A"], ["B"], ["B"], ["B"]], "A1 A2", [[" "], ["A/B"], ["B"], ["B"]]],
    [[["A"], ["B"], ["B"], ["B"]], "A1 A2 A3", [[" "], ["B"], ["A/B"], ["B"]]],
    [[["A"], ["A"], ["B"], ["B"]], "A1 A2", [[" "], ["A"], ["A/B"], ["B"]]],
    [[["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2", [[" "], ["A"], ["A/B"], ["B"], ["B"]]],
    [[["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2 A3", [[" "], [" "], ["A/B"], ["A/B"], ["B"]]],
  ])("can't swap to the bottom when not enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A"], ["B"], ["B"]], "A1 A2 A3", [["B"], ["B"], ["A"]]],
    [[["A"], ["B"], ["B"], ["B"]], "A1 A2 A3 A4", [["B"], ["B"], ["B"], ["A"]]],
    [[["A"], ["A"], ["B"], ["B"]], "A1 A2 A3", [["B"], ["B"], ["A"], ["A"]]],
    [[["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2 A3 A4", [["B"], ["B"], ["B"], ["A"], ["A"]]],
  ])("can swap to the bottom when enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A"], ["B"], ["C"], ["C"]], "A1 A2 A3", [["B"], [" "], ["A/C"], ["C"]]],
    [
      [
        ["A", "A"],
        ["B", "E"],
        ["D", "C"],
        [" ", "C"],
      ],
      "A1 A2 A3",
      [
        ["B", "E"],
        ["D", " "],
        ["A", "A/C"],
        [" ", "C"],
      ],
    ],
  ])("can make partial swap to the bottom", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});

describe("swap top", () => {
  test.each([
    [[["A"], ["A"], ["B"]], "A3 A2", [["A"], ["A/B"]]],
    [[["A"], ["A"], ["A"], ["B"]], "A4 A3", [["A"], ["A"], ["A/B"]]],
    [[["A"], ["A"], ["A"], ["B"]], "A4 A3 A2", [["A"], ["A/B"], ["A"]]],
    [[["A"], ["A"], ["B"], ["B"]], "A3 A2", [["A"], ["A/B"], ["B"]]],
    [[["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3", [["A"], ["A"], ["A/B"], ["B"]]],
    [[["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3 A2", [["A"], ["A/B"], ["A/B"]]],
  ])("can't swap to the top when not enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["A"], ["A"], ["B"]], "A3 A2 A1", [["B"], ["A"], ["A"]]],
    [[["A"], ["A"], ["A"], ["B"]], "A4 A3 A2 A1", [["B"], ["A"], ["A"], ["A"]]],
    [[["A"], ["A"], ["B"], ["B"]], "A3 A2 A1", [["B"], ["B"], ["A"], ["A"]]],
    [[["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3 A2 A1", [["B"], ["B"], ["A"], ["A"], ["A"]]],
  ])("can swap to the top when enough overlap", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });

  test.each([
    [[["C"], ["C"], ["B"], ["A"]], "A4 A3 A2", [["C"], ["A/C"], [" "], ["B"]]],
    [
      [
        ["C", " "],
        ["C", " "],
        ["B", "E"],
        ["A", "A"],
      ],
      "A4 A3 A2",
      [
        ["C", " "],
        ["A/C", "A"],
        [" ", " "],
        ["B", "E"],
      ],
    ],
  ])("can make partial swap to the top", (gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const transition = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});
