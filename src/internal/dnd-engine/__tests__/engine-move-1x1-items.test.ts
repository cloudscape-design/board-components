// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, fromTextPath, toString } from "../../debug-tools";
import { DndEngine } from "../engine";

describe("swap adjacent items", () => {
  test.each([
    [
      "swap E with B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1",
      [
        ["A", "E", "C"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ],
    ],
    [
      "swap E with H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["G", "E", "I"],
      ],
    ],
    [
      "swap E with D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2",
      [
        ["A", "B", "C"],
        ["E", "D", "F"],
        ["G", "H", "I"],
      ],
    ],
    [
      "swap E with F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2",
      [
        ["A", "B", "C"],
        ["D", "F", "E"],
        ["G", "H", "I"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("replace closest diagonal items", () => {
  test.each([
    [
      "replace A with E via B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1 A1",
      [
        ["E", "A", "C"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ],
    ],
    [
      "replace A with E via D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2 A1",
      [
        ["E", "B", "C"],
        ["A", "D", "F"],
        ["G", "H", "I"],
      ],
    ],
    [
      "replace C with E via B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B1 C1",
      [
        ["A", "C", "E"],
        ["D", "B", "F"],
        ["G", "H", "I"],
      ],
    ],
    [
      "replace C with E via F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2 C1",
      [
        ["A", "B", "E"],
        ["D", "F", "C"],
        ["G", "H", "I"],
      ],
    ],
    [
      "replace G with E via G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3 A3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["E", "G", "I"],
      ],
    ],
    [
      "replace G with E via D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 A2 A3",
      [
        ["A", "B", "C"],
        ["G", "D", "F"],
        ["E", "H", "I"],
      ],
    ],
    [
      "replace I with E via H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 B3 C3",
      [
        ["A", "B", "C"],
        ["D", "H", "F"],
        ["G", "I", "E"],
      ],
    ],
    [
      "replace I with E via F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B2 C2 C3",
      [
        ["A", "B", "C"],
        ["D", "F", "I"],
        ["G", "H", "E"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("swap distant items", () => {
  test.each([
    [
      "swap H with E,B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B3 B2 B1",
      [
        ["A", "H", "C"],
        ["D", "B", "F"],
        ["G", "E", "I"],
      ],
    ],
    [
      "swap B with E,H",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B1 B2 B3",
      [
        ["A", "E", "C"],
        ["D", "H", "F"],
        ["G", "B", "I"],
      ],
    ],
    [
      "swap D with E,F",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A2 B2 C2",
      [
        ["A", "B", "C"],
        ["E", "F", "D"],
        ["G", "H", "I"],
      ],
    ],
    [
      "swap F with E,D",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C2 B2 A2",
      [
        ["A", "B", "C"],
        ["F", "D", "E"],
        ["G", "H", "I"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("replace distant diagonal items", () => {
  test.each([
    [
      "replace I with A",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A1 B1 B2 B3 C3",
      [
        ["B", "E", "C"],
        ["D", "H", "F"],
        ["G", "I", "A"],
      ],
    ],
    [
      "replace A with I",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C3 C2 C1 B1 A1",
      [
        ["I", "A", "B"],
        ["D", "E", "C"],
        ["G", "H", "F"],
      ],
    ],
    [
      "replace C with G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A3 B3 B2 C2 C1",
      [
        ["A", "B", "G"],
        ["D", "F", "C"],
        ["H", "E", "I"],
      ],
    ],
    [
      "replace G with C",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "C1 C2 B2 A2 A3",
      [
        ["A", "B", "F"],
        ["G", "D", "E"],
        ["C", "H", "I"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});

describe("replace arbitrary items", () => {
  test.each([
    [
      "replace F with G",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "A3 A2 B2 C2",
      [
        ["A", "B", "C"],
        ["E", "F", "G"],
        ["D", "H", "I"],
      ],
    ],
    [
      "replace I with B",
      [
        ["A", "B", "C"],
        ["D", "E", "F"],
        ["G", "H", "I"],
      ],
      "B1 B2 C2 C3",
      [
        ["A", "E", "C"],
        ["D", "F", "I"],
        ["G", "H", "B"],
      ],
    ],
  ])("%s", (_, gridMatrix, path, expectation) => {
    const grid = fromMatrix(gridMatrix);
    const layoutShift = new DndEngine(grid).move(fromTextPath(path, grid));
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
