// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, toString } from "../../debug-tools";
import { LayoutEngine } from "../engine";
import { forEachTimes } from "./helpers";

test("element removal never leaves grid with unresolved conflicts", () => {
  forEachTimes(25, [[]], (args) => {
    const grid = generateGrid(...args);
    const layoutShift = new LayoutEngine(grid).remove("A").refloat().getLayoutShift();
    expect(layoutShift.conflicts).toHaveLength(0);
  });
});

describe("remove scenarios", () => {
  test.each([
    [
      "remove X forcing other items to float",
      [
        [" ", "X", "C"],
        ["A", "A", " "],
        ["E", "D", "D"],
      ],
      "X",
      [
        ["A", "A", "C"],
        ["E", "D", "D"],
      ],
    ],
  ])("%s", (_, gridMatrix, itemId, expectation) => {
    const layoutShift = new LayoutEngine(fromMatrix(gridMatrix)).remove(itemId).refloat().getLayoutShift();
    expect(toString(layoutShift.next)).toBe(toString(expectation));
  });
});
