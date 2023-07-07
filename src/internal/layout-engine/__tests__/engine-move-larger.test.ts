// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, fromTextPath, toString } from "../../debug-tools";
import { LayoutEngine } from "../engine";

describe("vertical swaps of larger items", () => {
  test.each([
    [
      "swap E with G",
      [
        ["A", "B", "C"],
        ["D", "E", "E"],
        ["G", "G", "I"],
      ],
      "B2 B3",
      [
        ["A", "B", "C"],
        ["D", " ", "I"],
        [" ", "E", "E"],
        ["G", "G", " "],
      ],
    ],
    [
      "swap B with H",
      [
        ["A", "B", "B"],
        ["D", "E", "F"],
        ["G", "H", "H"],
      ],
      "C1 C2 C3",
      [
        ["A", "E", "F"],
        ["D", "H", "H"],
        ["G", "B", "B"],
      ],
    ],
    [
      "swap A with G",
      [
        ["A", "A", "A"],
        ["D", "E", "E"],
        ["G", "G", "H"],
      ],
      "B1 B2 B3",
      [
        ["D", "E", "E"],
        ["G", "G", "H"],
        ["A", "A", "A"],
      ],
    ],
    [
      "swap A with H",
      [
        ["A", "A", " "],
        [" ", "E", "E"],
        ["G", "G", " "],
        [" ", "H", "H"],
      ],
      "A1 A2 A3 A4",
      [
        [" ", "E", "E"],
        ["G", "G", " "],
        [" ", "H", "H"],
        ["A", "A", " "],
      ],
    ],
    [
      "swap C with A",
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "C"],
      ],
      "C3 C2 C1",
      [
        ["B", "C", "C"],
        ["A", "A", "A"],
        ["A", "A", "A"],
      ],
    ],
    [
      "swap A with C",
      [
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "C"],
      ],
      "B2 B3",
      [
        ["B", "C", "C"],
        ["A", "A", "A"],
        ["A", "A", "A"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("horizontal swaps of larger items", () => {
  test.each([
    [
      "swap F and H",
      [
        ["A", "B", "C", "D"],
        ["F", "E", "E", "H"],
        ["G", "G", "I", "H"],
      ],
      "A2 B2 C2 D2",
      [
        ["A", "B", "C", "D"],
        ["E", "E", "I", "F"],
        ["G", "G", " ", "H"],
        [" ", " ", " ", "H"],
      ],
    ],
    [
      "swap A and B",
      [
        ["A", "A", "C", "B", "B"],
        ["A", "A", "D", "B", "B"],
        ["A", "A", "E", "G", "G"],
      ],
      "B2 C2 D2 E2",
      [
        ["C", "B", "B", "A", "A"],
        ["D", "B", "B", "A", "A"],
        ["E", "G", "G", "A", "A"],
      ],
    ],
    [
      "swap K and B",
      [
        [" ", "K", "C", "B", "B"],
        [" ", "K", "D", "B", "B"],
        [" ", "K", "E", "G", "G"],
      ],
      "B2 C2 D2 E2",
      [
        [" ", "C", "B", "B", "K"],
        [" ", "D", "B", "B", "K"],
        [" ", "E", "G", "G", "K"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("swaps with overlay", () => {
  test.each([
    [
      "swap S with D (overlay on the left)",
      [
        ["A", "A", "B", "B"],
        [" ", "S", "D", "D"],
      ],
      "B2 C2 D2",
      [
        ["A", "A", "B", "B"],
        [" ", "D", "D", "S"],
      ],
    ],
    [
      "swap S with D (overlay on the right)",
      [
        ["A", "A", "B", "B"],
        ["D", "D", "S", " "],
      ],
      "C2 B2 A2",
      [
        ["A", "A", "B", "B"],
        ["S", "D", "D", " "],
      ],
    ],
    [
      "swap S with D (overlay on the top)",
      [
        ["D", "A"],
        ["D", "A"],
        ["S", "B"],
        [" ", "B"],
      ],
      "A3 A2 A1",
      [
        ["S", "A"],
        ["D", "A"],
        ["D", "B"],
        [" ", "B"],
      ],
    ],
    [
      "swap S with D (overlay on the bottom)",
      [
        [" ", "A"],
        ["S", "A"],
        ["D", "B"],
        ["D", "B"],
      ],
      "A2 A3 A4",
      [
        ["D", "A"],
        ["D", "A"],
        [" ", "B"],
        ["S", "B"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("distant swaps", () => {
  test.each([
    [
      "swap E with F",
      [
        ["A", "A", "A", " "],
        ["B", "B", "B", " "],
        ["C", "D", "E", "E"],
        ["F", " ", " ", " "],
      ],
      "C3 B3 B4 A4",
      [
        ["A", "A", "A", "D"],
        ["B", "B", "B", " "],
        ["C", " ", "F", " "],
        ["E", "E", " ", " "],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("diagonal swaps of larger items", () => {
  test.each([
    [
      "swap A and D via B",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "B2 C2 D2 D3 D4",
      [
        ["B", "B", "D", "D"],
        ["B", "B", "D", "D"],
        ["C", "C", "A", "A"],
        ["C", "C", "A", "A"],
      ],
    ],
    [
      "swap A and D via C",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "A1 A2 A3 B3 C3",
      [
        ["C", "C", "B", "B"],
        ["C", "C", "B", "B"],
        ["D", "D", "A", "A"],
        ["D", "D", "A", "A"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("replacement moves of larger items", () => {
  test.each([
    [
      "move A to D touching B",
      [
        ["A", "A", "B", "B"],
        ["A", "A", "B", "B"],
        ["C", "C", "D", "D"],
        ["C", "C", "D", "D"],
      ],
      "B2 B3 C3 D3 D4 D5",
      [
        ["B", "B", "D", "D"],
        ["B", "B", "D", "D"],
        ["C", "C", "A", "A"],
        ["C", "C", "A", "A"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("long path moves", () => {
  test.each([
    [
      "A travels to bottom-right corner",
      [
        ["A", "F", "F", "F"],
        ["E", "D", "K", "R"],
        ["B", "B", "B", "M"],
        ["B", "B", "B", "M"],
        ["C", "C", "S", "G"],
      ],
      "A1 A2 B2 C2 D2 D3 D4 D5 C5 B5 A5",
      [
        ["E", "F", "F", "F"],
        ["D", "K", "R", "M"],
        ["B", "B", "B", "M"],
        ["B", "B", "B", "G"],
        ["A", "C", "C", "S"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("empty spaces are prioritized over disturbing other items", () => {
  test.each([
    [
      "E pushes C to the bottom",
      [
        ["A", "B", "C"],
        ["D", "E", "C"],
        [" ", "F", " "],
        [" ", "F", " "],
      ],
      "B2 C2",
      [
        ["A", "B", "E"],
        ["D", "F", "C"],
        [" ", "F", "C"],
      ],
    ],
    [
      "A pushes D to the bottom creating new line",
      [
        ["D", "A"],
        ["D", "F"],
      ],
      "B1 A1",
      [
        ["A", "F"],
        ["D", " "],
        ["D", " "],
      ],
    ],
    [
      "E pushes F to the right",
      [
        ["A", "B", "C", "C"],
        ["D", "E", "F", " "],
        ["G", "G", "F", " "],
        ["H", "H", "H", " "],
      ],
      "B2 C2",
      [
        ["A", "B", "C", "C"],
        ["D", " ", "E", "F"],
        ["G", "G", " ", "F"],
        ["H", "H", "H", " "],
      ],
    ],
    [
      "G pushes E to the left",
      [
        ["A", "B", "C"],
        [" ", "E", "C"],
        [" ", "E", "G"],
        [" ", "E", "G"],
        [" ", "F", "F"],
      ],
      "C3 B3",
      [
        ["A", "B", "C"],
        ["E", "G", "C"],
        ["E", "G", " "],
        ["E", "F", "F"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("multiple overlap resolutions", () => {
  test.each([
    [
      "G forces C to resolve twice",
      [
        ["A", "A", " ", "F"],
        ["E", "B", "B", "F"],
        ["G", "B", "B", " "],
        ["H", " ", "C", " "],
        [" ", " ", "C", " "],
        [" ", " ", "D", " "],
      ],
      "A3 B3 B2 C2",
      [
        ["E", "C", "A", "A"],
        ["H", "C", "G", "F"],
        [" ", "B", "B", "F"],
        [" ", "B", "B", " "],
        [" ", " ", "D", " "],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).getLayoutShift();
    const moveIds = layoutShift.moves.filter((move) => move.type !== "MOVE").map((move) => move.itemId);
    expect(toString(layoutShift.next)).toBe(toString(expectation));
    expect(new Set(moveIds).size).toBeLessThan(moveIds.length);
  });
});

describe("escape moves", () => {
  test.each([
    [
      "X does not force A to escape, the last user move step is not applied",
      [
        ["A", "A", "A", "F"],
        ["B", "B", "X", "F"],
        ["B", "B", "X", "F"],
        ["C", "C", "C", "C"],
        [" ", "E", "D", "D"],
        [" ", "E", "D", "D"],
      ],
      "C2 C3 D3 D2",
      [
        ["A", "A", "A", " "],
        ["C", "C", "C", "C"],
        ["B", "B", "F", "X"],
        ["B", "B", "F", "X"],
        [" ", "E", "F", " "],
        [" ", "E", "D", "D"],
        [" ", " ", "D", "D"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new LayoutEngine(grid).move(fromTextPath(path, grid)).getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
    expect(layoutShift.moves.filter((move) => move.type === "MOVE")).toHaveLength(2);
    expect(layoutShift.conflicts).toEqual(["A"]);
  });
});

test("Float moves don't interfere with swaps", () => {
  const grid = fromMatrix([
    ["A", "B"],
    ["A", "B"],
    ["A", "C"],
    ["A", "C"],
    ["D", "E"],
    ["D", "E"],
    [" ", "F"],
    [" ", "F"],
  ]);
  const layoutShift = new LayoutEngine(grid).move(fromTextPath("B3 B2 B1", grid)).getLayoutShift();

  expect(toString(layoutShift.next)).toBe(
    toString([
      ["A", "C"],
      ["A", "C"],
      ["A", "B"],
      ["A", "B"],
      ["D", "E"],
      ["D", "E"],
      [" ", "F"],
      [" ", "F"],
    ])
  );
});
