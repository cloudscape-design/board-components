// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { range } from "lodash";
import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../debug-tools";
import { generateGrid } from "./generators";
import { withCommit } from "./helpers";

test("element removal never leaves grid with unresolved conflicts", () => {
  range(0, 25).forEach(() => {
    const grid = generateGrid();
    const transition = withCommit(grid, (engine) => engine.remove("A"));
    expect(transition.blocks).toHaveLength(0);
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
    const grid = fromMatrix(gridMatrix);
    const transition = withCommit(grid, (engine) => engine.remove(itemId));
    expect(toString(transition.end)).toBe(toString(expectation));
  });
});
