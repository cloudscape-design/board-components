// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";

import { Position } from "../../../internal/utils/position";
import { appendMovePath, appendResizePath, normalizeInsertionPath } from "../path";

describe("normalizeInsertionPath", () => {
  test("keeps path unchanged if empty", () => {
    expect(normalizeInsertionPath([], "right", 4, 1)).toEqual([]);
  });

  test("keeps path unchanged if it has a single step", () => {
    const path = [new Position({ x: 0, y: 0 })];
    expect(normalizeInsertionPath(path, "right", 4, 1)).toEqual(path);
  });

  test("removes repeated steps from the left", () => {
    const path = [
      new Position({ x: 0, y: 0 }),
      new Position({ x: 0, y: 1 }),
      new Position({ x: 1, y: 1 }),
      new Position({ x: 1, y: 2 }),
      new Position({ x: 0, y: 2 }),
      new Position({ x: 1, y: 2 }),
    ];
    expect(normalizeInsertionPath(path, "left", 4, 4)).toEqual([path[4], path[5]]);
  });

  test("removes repeated steps from the right", () => {
    const path = [
      new Position({ x: 3, y: 0 }),
      new Position({ x: 3, y: 1 }),
      new Position({ x: 2, y: 1 }),
      new Position({ x: 2, y: 2 }),
      new Position({ x: 3, y: 2 }),
      new Position({ x: 2, y: 2 }),
    ];
    expect(normalizeInsertionPath(path, "right", 4, 4)).toEqual([path[4], path[5]]);
  });

  test("removes repeated steps from the top", () => {
    const path = [
      new Position({ y: 0, x: 0 }),
      new Position({ y: 0, x: 1 }),
      new Position({ y: 1, x: 1 }),
      new Position({ y: 1, x: 2 }),
      new Position({ y: 0, x: 2 }),
      new Position({ y: 1, x: 2 }),
    ];
    expect(normalizeInsertionPath(path, "up", 4, 4)).toEqual([path[4], path[5]]);
  });

  test("removes repeated steps from the bottom", () => {
    const path = [
      new Position({ y: 5, x: 0 }),
      new Position({ y: 5, x: 1 }),
      new Position({ y: 4, x: 1 }),
      new Position({ y: 4, x: 2 }),
      new Position({ y: 5, x: 2 }),
      new Position({ y: 4, x: 2 }),
    ];
    expect(normalizeInsertionPath(path, "down", 4, 6)).toEqual([path[4], path[5]]);
  });
});

describe("appendMovePath", () => {
  test("appends new position as first if the path is empty", () => {
    const rect = { left: 1, right: 2, top: 3, bottom: 4 };
    expect(appendMovePath([], rect)).toEqual([new Position({ x: 1, y: 3 })]);
  });

  test("does not append new position if it is the same as previous", () => {
    const path = [new Position({ x: 1, y: 3 })];
    const rect = { left: 1, right: 2, top: 3, bottom: 4 };
    expect(appendMovePath(path, rect)).toEqual(path);
  });

  test("appends new position as direct increment", () => {
    const path = [new Position({ x: 1, y: 3 })];
    const rect = { left: 2, right: 3, top: 3, bottom: 4 };
    expect(appendMovePath(path, rect)).toEqual([...path, new Position({ x: 2, y: 3 })]);
  });

  test("appends new position and injects missing steps", () => {
    const path = [new Position({ x: 1, y: 3 })];
    const rect = { left: 2, right: 3, top: 4, bottom: 5 };
    expect(appendMovePath(path, rect)).toEqual([...path, new Position({ x: 2, y: 3 }), new Position({ x: 2, y: 4 })]);
  });

  test("throws if can't find incremental path within 100 steps", () => {
    const path = [new Position({ x: 0, y: 0 })];
    const rect = { left: 0, right: 1, top: 100, bottom: 101 };
    expect(() => appendMovePath(path, rect)).toThrow("Invariant violation: infinite loop in appendPath.");
  });
});

describe("appendResizePath", () => {
  test("appends new position as first if the path is empty", () => {
    const rect = { left: 1, right: 2, top: 3, bottom: 4 };
    expect(appendResizePath([], rect)).toEqual([new Position({ x: 2, y: 4 })]);
  });

  test("does not append new position if it is the same as previous", () => {
    const path = [new Position({ x: 2, y: 4 })];
    const rect = { left: 1, right: 2, top: 3, bottom: 4 };
    expect(appendResizePath(path, rect)).toEqual(path);
  });

  test("appends new position as direct increment", () => {
    const path = [new Position({ x: 2, y: 4 })];
    const rect = { left: 2, right: 3, top: 3, bottom: 4 };
    expect(appendResizePath(path, rect)).toEqual([...path, new Position({ x: 3, y: 4 })]);
  });

  test("appends new position and injects missing steps", () => {
    const path = [new Position({ x: 2, y: 4 })];
    const rect = { left: 2, right: 3, top: 4, bottom: 5 };
    expect(appendResizePath(path, rect)).toEqual([...path, new Position({ x: 3, y: 4 }), new Position({ x: 3, y: 5 })]);
  });
});
