// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";

import { GridLayoutItem } from "../../../internal/interfaces";
import { getHoveredRect } from "../get-hovered-rect";

const placeholders: GridLayoutItem[] = [
  { id: "awsui-placeholder-board-a-0-0", x: 0, y: 0, width: 1, height: 1 },
  { id: "awsui-placeholder-board-a-0-1", x: 1, y: 0, width: 1, height: 1 },
  { id: "awsui-placeholder-board-a-1-0", x: 0, y: 1, width: 1, height: 1 },
  { id: "awsui-placeholder-board-a-1-1", x: 1, y: 1, width: 1, height: 1 },
];

describe("getHoveredRect", () => {
  test("computes the bounding rect of the collided placeholders", () => {
    const rect = getHoveredRect(["awsui-placeholder-board-a-0-0", "awsui-placeholder-board-a-1-1"], placeholders);
    expect(rect).toEqual({ top: 0, left: 0, bottom: 2, right: 2 });
  });

  // Defensive: an ID that is not in the placeholder set must be skipped, not dereferenced. A raw
  // `.find(...)!` here would return `undefined` and throw in the reduce below. This mirrors the
  // multi-board case where a stray collision ID from another board could reach this function.
  test("ignores collision ids that do not belong to the given placeholders", () => {
    const rect = getHoveredRect(
      ["awsui-placeholder-board-a-0-0", "awsui-placeholder-board-b-3-3", "awsui-placeholder-board-a-0-1"],
      placeholders,
    );
    expect(rect).toEqual({ top: 0, left: 0, bottom: 1, right: 2 });
  });

  test("returns an empty (inverted) rect when no collision id matches", () => {
    const rect = getHoveredRect(["awsui-placeholder-board-b-0-0"], placeholders);
    expect(rect).toEqual({
      top: Number.POSITIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
    });
  });
});
