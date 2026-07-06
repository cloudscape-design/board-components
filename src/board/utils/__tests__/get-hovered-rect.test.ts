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

  // A stray ID that is not in the placeholder set (e.g. from another board sharing the controller)
  // must be skipped, and the rect computed from the matching ones only.
  test("ignores collision ids that do not belong to the given placeholders", () => {
    const rect = getHoveredRect(
      ["awsui-placeholder-board-a-0-0", "awsui-placeholder-board-b-3-3", "awsui-placeholder-board-a-0-1"],
      placeholders,
    );
    expect(rect).toEqual({ top: 0, left: 0, bottom: 1, right: 2 });
  });

  // Regression: when NO collision id matches, the function must return null. Previously it returned
  // an inverted `±Infinity` rect, which callers fed into appendPath, seeding the transition path
  // with an out-of-range position and later throwing "infinite loop in appendPath".
  test("returns null when no collision id matches", () => {
    expect(getHoveredRect(["awsui-placeholder-board-b-0-0"], placeholders)).toBeNull();
    expect(getHoveredRect([], placeholders)).toBeNull();
  });
});
