// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { BoardItemDefinition } from "../../interfaces";
import {
  createItemsLayout,
  createPlaceholdersLayout,
  exportItemsLayout,
  getDefaultItemSize,
  getMinItemSize,
} from "../layout";

function makeItem(
  id: string,
  columnOffset: number,
  columnSpan: number,
  rowSpan: number,
  minColumnSpan = 1,
  minRowSpan = 1
): BoardItemDefinition<unknown> {
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
        ["A1", "B1"],
        ["A2", "B2"],
        ["A2", "B2"],
        ["A3", "B3"],
        ["A3", "B3"],
      ],
    ],
    [
      [makeItem("A", 0, 2, 3), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)],
      3,
      [
        ["A", "A", " "],
        ["A", "A", " "],
        ["A", "A", " "],
        [" ", "B", "B"],
        [" ", "B", "B"],
        [" ", " ", "C"],
        [" ", " ", "C"],
      ],
    ],
    [
      [makeItem("A", 0, 1, 1), makeItem("B", 1, 1, 1), makeItem("C", 0, 2, 1)],
      1,
      [["A"], ["A"], ["B"], ["B"], ["C"], ["C"]],
    ],
    [
      [makeItem("A", 0, 1, 1, 2, 2), makeItem("B", 0, 1, 1, 3, 1)],
      3,
      [
        ["A", "A", " "],
        ["A", "A", " "],
        ["B", "B", "B"],
        ["B", "B", "B"],
      ],
    ],
  ])("Transforms board items to internal grid layout", (items, columns, expectation) => {
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
  test("Transforms internal grid layout to board items", () => {
    const exported = exportItemsLayout(
      fromMatrix([
        ["A", "A", " "],
        ["A", "A", " "],
        [" ", "B", "B"],
        [" ", " ", "C"],
        [" ", " ", "C"],
      ]),
      [makeItem("A", 0, 1, 1), makeItem("B", 0, 1, 1), makeItem("C", 0, 1, 1)],
      true
    );
    expect(exported).toEqual([makeItem("A", 0, 2, 2), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)]);
  });

  test("Updates items columnOffset and columnSpan when updateColumns=true", () => {
    const exported = exportItemsLayout(
      fromMatrix([["A"], ["A"], ["B"], ["C"], ["C"]]),
      [makeItem("A", 0, 1, 1), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 1)],
      true
    );
    expect(exported).toEqual([makeItem("A", 0, 1, 2), makeItem("B", 0, 1, 1), makeItem("C", 0, 1, 2)]);
  });

  test("Keeps items columnOffset and columnSpan when updateColumns=false", () => {
    const exported = exportItemsLayout(
      fromMatrix([["A"], ["A"], ["B"], ["C"], ["C"]]),
      [makeItem("A", 0, 1, 1), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 1)],
      false
    );
    expect(exported).toEqual([makeItem("A", 0, 1, 2), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)]);
  });
});

describe("getMinItemSize", () => {
  test("returns 1 as min width when definition is undefined or smaller", () => {
    expect(
      getMinItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
        data: null,
      }).width
    ).toBe(1);

    expect(
      getMinItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1, minColumnSpan: 0 },
        data: null,
      }).width
    ).toBe(1);
  });

  test("returns 2 as min height when definition is undefined or smaller", () => {
    expect(
      getMinItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
        data: null,
      }).height
    ).toBe(2);

    expect(
      getMinItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1, minRowSpan: 1 },
        data: null,
      }).height
    ).toBe(2);
  });

  test("returns defined size when above defaults", () => {
    expect(
      getMinItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1, minColumnSpan: 2, minRowSpan: 3 },
        data: null,
      })
    ).toEqual({ width: 2, height: 3 });
  });
});

describe("getDefaultItemSize", () => {
  test("returns 1 as default width when definition is smaller", () => {
    expect(
      getDefaultItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 0, defaultRowSpan: 1 },
        data: null,
      }).width
    ).toBe(1);
  });

  test("returns 2 as default height when definition is smaller", () => {
    expect(
      getDefaultItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
        data: null,
      }).height
    ).toBe(2);
  });

  test("returns defined size when above defaults", () => {
    expect(
      getDefaultItemSize({
        id: "Test",
        definition: { defaultColumnSpan: 2, defaultRowSpan: 3 },
        data: null,
      })
    ).toEqual({ width: 2, height: 3 });
  });
});
