// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { applyMove } from "../engine";
import { generateGrid, generateMovePath } from "./generators";
import { createMoveRunner, createMoveTestSuite, forEachTimes } from "./helpers";

test("any move on a grid with 1x1 items only is resolved", () => {
  forEachTimes(33, [generateGrid(4, 10, 1, 1), generateGrid(5, 15, 1, 1), generateGrid(6, 20, 1, 1)], (grid) => {
    const movePath = generateMovePath(grid, "any");
    const transition = applyMove(grid, movePath);
    expect(transition.blocks.length).toBe(0);
  });
});

test("all vertical moves are resolved if all items have height=1", () => {
  forEachTimes(33, [generateGrid(4, 10, 1.5, 1), generateGrid(5, 15, 1.5, 1), generateGrid(6, 20, 1.5, 1)], (grid) => {
    const movePath = generateMovePath(grid, "vertical");
    const transition = applyMove(grid, movePath);
    expect(transition.blocks.length).toBe(0);
  });
});

test("all vertical moves are resolved if all items have width=1", () => {
  forEachTimes(33, [generateGrid(4, 10, 1, 1.5), generateGrid(5, 15, 1, 1.5), generateGrid(6, 20, 1, 1.5)], (grid) => {
    const movePath = generateMovePath(grid, "horizontal");
    const transition = applyMove(grid, movePath);
    expect(transition.blocks.length).toBe(0);
  });
});

describe("swap right", () => {
  test.each([
    [[["A", "B", "B"]], "A1 B1", [[" ", "A/B", "B"]]],
    [[["A", "B", "B", "B"]], "A1 B1", [[" ", "A/B", "B", "B"]]],
    [[["A", "B", "B", "B"]], "A1 B1 C1", [[" ", "B", "A/B", "B"]]],
    [[["A", "A", "B", "B"]], "A1 B1", [[" ", "A", "A/B", "B"]]],
    [[["A", "A", "B", "B", "B"]], "A1 B1", [[" ", "A", "A/B", "B", "B"]]],
    [[["A", "A", "B", "B", "B"]], "A1 B1 C1", [[" ", " ", "A/B", "A/B", "B"]]],
  ])("can't swap to the right when not enough overlap", (...inputs) => {
    const { run, expectation } = createMoveTestSuite(...inputs);
    expect(run().result).toBe(expectation);
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
  ])("can make partial swap to the right", (...inputs) => {
    const { run, expectation } = createMoveTestSuite(...inputs);
    expect(run().result).toBe(expectation);
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
  ])("can make partial swap to the left", (...inputs) => {
    const { run, expectation } = createMoveTestSuite(...inputs);
    expect(run().result).toBe(expectation);
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
  ])("can make partial swap to the bottom", (...inputs) => {
    const { run, expectation } = createMoveTestSuite(...inputs);
    expect(run().result).toBe(expectation);
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
  ])("can make partial swap to the top", (...inputs) => {
    const { run, expectation } = createMoveTestSuite(...inputs);
    expect(run().result).toBe(expectation);
  });
});
