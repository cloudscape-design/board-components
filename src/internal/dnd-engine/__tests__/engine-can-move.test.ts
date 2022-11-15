// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { applyMove } from "../engine";
import { createMoveRunner, createMoveTestSuite, generateGrid, generateMovePath } from "./helpers";

/*
  The below tests validate if the first move should be allowed or not.
*/

describe("replace", () => {
  test("all replace moves are allowed", () => {
    range(0, 100).forEach(() => {
      const grid = generateGrid();
      const movePath = generateMovePath(grid, "replace");
      const transition = applyMove(grid, movePath);
      expect(transition.moves.length).toBeGreaterThan(0);
    });
  });
});

describe("swap vertical", () => {
  test("all vertical moves are allowed if all items have height=1", () => {
    range(0, 100).forEach(() => {
      const grid = generateGrid(6, 20, 1.5, 1);
      const movePath = generateMovePath(grid, "swap-vertical");
      const transition = applyMove(grid, movePath);
      expect(transition.moves.length).toBeGreaterThan(0);
    });
  });
});

describe("swap horizontal", () => {
  test("all horizontal moves are allowed if all items have width=1", () => {
    range(0, 100).forEach(() => {
      const grid = generateGrid(6, 20, 1, 1.5);
      const movePath = generateMovePath(grid, "swap-horizontal");
      const transition = applyMove(grid, movePath);
      expect(transition.moves.length).toBeGreaterThan(0);
    });
  });
});

describe("swap right", () => {
  test.each([
    createMoveRunner([["A", "B", "B"]], "A1 B1"),
    createMoveRunner([["A", "B", "B", "B"]], "A1 B1"),
    createMoveRunner([["A", "B", "B", "B"]], "A1 B1 C1"),
    createMoveRunner([["A", "A", "B", "B"]], "A1 B1"),
    createMoveRunner([["A", "A", "B", "B", "B"]], "A1 B1"),
    createMoveRunner([["A", "A", "B", "B", "B"]], "A1 B1 C1"),
  ])("can't swap to the right when not enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.filter((move) => move.itemId === "B")).toHaveLength(0);
  });

  test.each([
    createMoveRunner([["A", "B", "B"]], "A1 B1 C1"),
    createMoveRunner([["A", "B", "B", "B"]], "A1 B1 C1 D1"),
    createMoveRunner([["A", "A", "B", "B"]], "A1 B1 C1"),
    createMoveRunner([["A", "A", "B", "B", "B"]], "A1 B1 C1 D1"),
  ])("can swap to the right when enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.length).toBeGreaterThan(0);
  });

  test.each([
    createMoveTestSuite("", [["A", "B", "C", "C"]], "A1 B1 C1", [["B", " ", "A/C", "C"]]),
    createMoveTestSuite(
      "",
      [
        ["A", "B", "C", " "],
        ["A", "E", "D", "D"],
      ],
      "A1 B1 C1",
      [
        ["B", "C", "A", " "],
        ["E", " ", "A/D", "D"],
      ]
    ),
  ])("can make partial swap to the right", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("swap left", () => {
  test.each([
    createMoveRunner([["A", "A", "B"]], "C1 B1"),
    createMoveRunner([["A", "A", "A", "B"]], "D1 C1"),
    createMoveRunner([["A", "A", "A", "B"]], "D1 C1 B1"),
    createMoveRunner([["A", "A", "B", "B"]], "C1 B1"),
    createMoveRunner([["A", "A", "A", "B", "B"]], "D1 C1"),
    createMoveRunner([["A", "A", "A", "B", "B"]], "D1 C1 B1"),
  ])("can't swap to the left when not enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.filter((move) => move.itemId === "A")).toHaveLength(0);
  });

  test.each([
    createMoveRunner([["A", "A", "B"]], "C1 B1 A1"),
    createMoveRunner([["A", "A", "A", "B"]], "D1 C1 B1 A1"),
    createMoveRunner([["A", "A", "B", "B"]], "C1 B1 A1"),
    createMoveRunner([["A", "A", "A", "B", "B"]], "D1 C1 B1 A1"),
  ])("can swap to the left when enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.length).toBeGreaterThan(0);
  });

  test.each([
    createMoveTestSuite("", [["C", "C", "B", "A"]], "D1 C1 B1", [["C", "A/C", " ", "B"]]),
    createMoveTestSuite(
      "",
      [
        ["C", "C", "B", "A"],
        [" ", " ", "E", "A"],
      ],
      "D1 C1 B1",
      [
        ["C", "A/C", " ", "B"],
        [" ", "A", " ", "E"],
      ]
    ),
  ])("can make partial swap to the left", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("swap bottom", () => {
  test.each([
    createMoveRunner([["A"], ["B"], ["B"]], "A1 A2"),
    createMoveRunner([["A"], ["B"], ["B"], ["B"]], "A1 A2"),
    createMoveRunner([["A"], ["B"], ["B"], ["B"]], "A1 A2 A3"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"]], "A1 A2"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2 A3"),
  ])("can't swap to the bottom when not enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.filter((move) => move.itemId === "B")).toHaveLength(0);
  });

  test.each([
    createMoveRunner([["A"], ["B"], ["B"]], "A1 A2 A3"),
    createMoveRunner([["A"], ["B"], ["B"], ["B"]], "A1 A2 A3 A4"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"]], "A1 A2 A3"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"], ["B"]], "A1 A2 A3 A4"),
  ])("can swap to the bottom when enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.length).toBeGreaterThan(0);
  });

  test.each([
    createMoveTestSuite("", [["A"], ["B"], ["C"], ["C"]], "A1 A2 A3", [["B"], [" "], ["A/C"], ["C"]]),
    createMoveTestSuite(
      "",
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
      ]
    ),
  ])("can make partial swap to the bottom", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});

describe("swap top", () => {
  test.each([
    createMoveRunner([["A"], ["A"], ["B"]], "A3 A2"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"]], "A4 A3"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"]], "A4 A3 A2"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"]], "A3 A2"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3 A2"),
  ])("can't swap to the top when not enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.filter((move) => move.itemId === "A")).toHaveLength(0);
  });

  test.each([
    createMoveRunner([["A"], ["A"], ["B"]], "A3 A2 A1"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"]], "A4 A3 A2 A1"),
    createMoveRunner([["A"], ["A"], ["B"], ["B"]], "A3 A2 A1"),
    createMoveRunner([["A"], ["A"], ["A"], ["B"], ["B"]], "A4 A3 A2 A1"),
  ])("can swap to the top when enough overlap", (run) => {
    const transition = run();
    expect(transition.moves.length).toBeGreaterThan(0);
  });

  test.each([
    createMoveTestSuite("", [["C"], ["C"], ["B"], ["A"]], "A4 A3 A2", [["C"], ["A/C"], [" "], ["B"]]),
    createMoveTestSuite(
      "",
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
      ]
    ),
  ])("can make partial swap to the top", (_, run) => {
    const { result, expectation } = run();
    expect(result).toBe(expectation);
  });
});
