// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { DashboardItem } from "../../interfaces";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../layout";

function makeItem(
  id: string,
  columnOffset: number,
  columnSpan: number,
  rowSpan: number,
  minColumnSpan = 1,
  minRowSpan = 1
): DashboardItem<unknown> {
  return {
    id,
    columnOffset,
    rowSpan,
    columnSpan,
    definition: { defaultRowSpan: 1, defaultColumnSpan: 1, minColumnSpan, minRowSpan },
    data: null,
  };
}

describe("createItemsLayout", () => {
  test.each([
    [
      [
        makeItem("A1", 0, 1, 1),
        makeItem("A2", 0, 1, 1),
        makeItem("A3", 0, 1, 1),
        makeItem("B1", 1, 1, 1),
        makeItem("B2", 1, 1, 1),
        makeItem("B3", 1, 1, 1),
      ],
      2,
      [
        ["A1", "B1"],
        ["A2", "B2"],
        ["A3", "B3"],
      ],
    ],
    [
      [makeItem("A", 0, 2, 2), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)],
      3,
      [
        ["A", "A", " "],
        ["A", "A", " "],
        [" ", "B", "B"],
        [" ", " ", "C"],
        [" ", " ", "C"],
      ],
    ],
    [[makeItem("A", 0, 1, 1), makeItem("B", 1, 1, 1), makeItem("C", 0, 2, 1)], 1, [["A"], ["B"], ["C"]]],
    [
      [makeItem("A", 0, 1, 1, 2, 2), makeItem("B", 0, 1, 1, 3, 1)],
      3,
      [
        ["A", "A", " "],
        ["A", "A", " "],
        ["B", "B", "B"],
      ],
    ],
  ])("Transforms dashboard items to internal grid layout", (items, columns, expectation) => {
    expect(toString(createItemsLayout(items, columns))).toBe(toString(expectation));
  });
});

describe("createPlaceholdersLayout", () => {
  test("Creates placeholder layout for the given rows, cols", () => {
    const layout = createPlaceholdersLayout(3, 2);
    expect(toString(layout)).toBe(
      toString([
        ["awsui-placeholder-0-0", "awsui-placeholder-0-1"],
        ["awsui-placeholder-1-0", "awsui-placeholder-1-1"],
        ["awsui-placeholder-2-0", "awsui-placeholder-2-1"],
      ])
    );
  });
});

describe("exportItemsLayout", () => {
  test("Transforms internal grid layout to dashboard items", () => {
    const exported = exportItemsLayout(
      fromMatrix([
        ["A", "A", " "],
        ["A", "A", " "],
        [" ", "B", "B"],
        [" ", " ", "C"],
        [" ", " ", "C"],
      ]),
      [makeItem("A", 0, 1, 1), makeItem("B", 0, 1, 1), makeItem("C", 0, 1, 1)]
    );
    expect(exported).toEqual([makeItem("A", 0, 2, 2), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)]);
  });
});
