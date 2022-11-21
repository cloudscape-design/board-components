// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { fromMatrix, generateGrid, toString } from "../debug-tools";
import { DndEngine } from "../engine";

test("element removal never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const transition = new DndEngine(grid).remove("A");
    expect(transition.conflicts).toHaveLength(0);
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
    const transition = new DndEngine(fromMatrix(gridMatrix)).remove(itemId);
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});
