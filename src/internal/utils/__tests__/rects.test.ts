// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { getClosestNeighbor, getGridPlacement, isInside, isIntersecting } from "../rects";

const grid = [
  [
    { left: 0, right: 3, top: 0, bottom: 3 },
    { left: 4, right: 7, top: 0, bottom: 3 },
    { left: 8, right: 11, top: 0, bottom: 3 },
  ],
  [
    { left: 0, right: 3, top: 4, bottom: 7 },
    { left: 4, right: 7, top: 4, bottom: 7 },
    { left: 8, right: 11, top: 4, bottom: 7 },
  ],
].flatMap((r) => r);

describe("isInside", () => {
  test("returns true if target rect is within bounds (not touching)", () => {
    const bounds = { left: 0, right: 3, top: 0, bottom: 3 };
    const target = { left: 1, right: 2, top: 1, bottom: 2 };
    expect(isInside(target, bounds)).toBe(true);
  });

  test("returns true if target rect is within bounds (touching)", () => {
    const bounds = { left: 1, right: 1, top: 1, bottom: 1 };
    const target = { left: 1, right: 1, top: 1, bottom: 1 };
    expect(isInside(target, bounds)).toBe(true);
  });

  test("returns false if target rect is outside bounds", () => {
    const bounds = { left: 2, right: 8, top: 2, bottom: 8 };
    expect(isInside({ left: 1, right: 6, top: 4, bottom: 6 }, bounds)).toBe(false);
    expect(isInside({ left: 4, right: 9, top: 4, bottom: 6 }, bounds)).toBe(false);
    expect(isInside({ left: 4, right: 6, top: 1, bottom: 6 }, bounds)).toBe(false);
    expect(isInside({ left: 4, right: 6, top: 4, bottom: 9 }, bounds)).toBe(false);
  });
});

describe("isIntersecting", () => {
  test("returns true if one rect contains another", () => {
    const bounds = { left: 0, right: 3, top: 0, bottom: 3 };
    const target = { left: 1, right: 2, top: 1, bottom: 2 };
    expect(isIntersecting(target, bounds)).toBe(true);
    expect(isIntersecting(bounds, target)).toBe(true);
  });

  test("returns true if one rect matches another", () => {
    const rect1 = { left: 1, right: 2, top: 3, bottom: 4 };
    const rect2 = { left: 1, right: 2, top: 3, bottom: 4 };
    expect(isIntersecting(rect1, rect2)).toBe(true);
    expect(isIntersecting(rect2, rect1)).toBe(true);
  });

  test("returns true if one rect intersects with another", () => {
    const source = { left: 2, right: 4, top: 2, bottom: 4 };

    // Touching source's top-left corner.
    expect(isIntersecting(source, { left: 0, right: 3, top: 0, bottom: 3 })).toBe(true);

    // Touching source's bottom-right corner.
    expect(isIntersecting(source, { left: 3, right: 6, top: 3, bottom: 6 })).toBe(true);
  });

  test("returns false if one rect does not intersect with another", () => {
    const rect1 = { left: 2, right: 4, top: 2, bottom: 4 };
    const rect2 = { left: 2, right: 4, top: 4, bottom: 6 };
    expect(isIntersecting(rect1, rect2)).toBe(false);
  });
});

describe("getGridPlacement", () => {
  test('returns "infinite" placement if no intersections found', () => {
    const target = { left: 0, right: 2, top: 10, bottom: 12 };
    expect(getGridPlacement(target, grid)).toEqual({
      left: Number.POSITIVE_INFINITY,
      right: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      bottom: Number.POSITIVE_INFINITY,
    });
  });

  test("returns single-cell placement", () => {
    const target = { left: 1, right: 2, top: 5, bottom: 6 };
    expect(getGridPlacement(target, grid)).toEqual({ left: 0, right: 3, top: 4, bottom: 7 });
  });

  test("returns multi-cell placement", () => {
    const target = { left: 6, right: 10, top: 2, bottom: 6 };
    expect(getGridPlacement(target, grid)).toEqual({ left: 4, right: 11, top: 0, bottom: 7 });
  });
});

describe("getClosestNeighbor", () => {
  test("returns null if can't find a neighbor in the given direction", () => {
    expect(
      getClosestNeighbor({
        target: { left: -2, right: -1, top: 0, bottom: 1 },
        sources: grid,
        direction: "left",
        isRtl: false,
      }),
    ).toBe(null);
    expect(
      getClosestNeighbor({
        target: { left: 12, right: 13, top: 0, bottom: 1 },
        sources: grid,
        direction: "right",
        isRtl: false,
      }),
    ).toBe(null);
    expect(
      getClosestNeighbor({
        target: { left: 0, right: 1, top: -2, bottom: -1 },
        sources: grid,
        direction: "up",
        isRtl: false,
      }),
    ).toBe(null);
    expect(
      getClosestNeighbor({
        target: { left: 0, right: 1, top: 8, bottom: 9 },
        sources: grid,
        direction: "down",
        isRtl: false,
      }),
    ).toBe(null);
  });

  test("returns closest grid cell in the given direction", () => {
    expect(
      getClosestNeighbor({
        target: { left: -2, right: -1, top: 3, bottom: 4 },
        sources: grid,
        direction: "right",
        isRtl: false,
      }),
    ).toBe(grid[3]);
    expect(
      getClosestNeighbor({
        target: { left: 12, right: 13, top: 3, bottom: 4 },
        sources: grid,
        direction: "left",
        isRtl: false,
      }),
    ).toBe(grid[5]);
    expect(
      getClosestNeighbor({
        target: { left: 5, right: 6, top: -2, bottom: -1 },
        sources: grid,
        direction: "down",
        isRtl: false,
      }),
    ).toBe(grid[1]);
    expect(
      getClosestNeighbor({
        target: { left: 5, right: 6, top: 8, bottom: 9 },
        sources: grid,
        direction: "up",
        isRtl: false,
      }),
    ).toBe(grid[4]);
  });
});
