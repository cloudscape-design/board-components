// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { BoardItemDefinition } from "../../interfaces";
import { CommittedMove, LayoutShift } from "../../layout-engine/interfaces";
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

function makeLayoutShift(
  layout: string[][],
  moves: CommittedMove[] = [{ itemId: "A", type: "MOVE", x: 0, y: 0, width: 0, height: 0 }]
): LayoutShift {
  return { current: fromMatrix(layout), next: fromMatrix(layout), moves, conflicts: [] };
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

  test("normalizes columnOffset and columnSpan for tablet layout", () => {
    const layout = createItemsLayout(
      [makeItem("A", 0, 1, 2), makeItem("B", 1, 2, 2), makeItem("C", 0, 3, 2), makeItem("D", 0, 4, 2)],
      2
    );
    expect(toString(layout)).toBe(
      toString([
        ["A", "B"],
        ["A", "B"],
        ["C", "C"],
        ["C", "C"],
        ["D", "D"],
        ["D", "D"],
      ])
    );
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
      makeLayoutShift([
        ["A", "A", " "],
        ["A", "A", " "],
        [" ", "B", "B"],
        [" ", " ", "C"],
        [" ", " ", "C"],
      ]),
      [makeItem("A", 0, 1, 1), makeItem("B", 0, 1, 1), makeItem("C", 0, 1, 1)],
      4
    );
    expect(exported).toEqual([makeItem("A", 0, 2, 2), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 2)]);
  });

  test("Updates items columnOffset and columnSpan when columns=4", () => {
    const exported = exportItemsLayout(
      makeLayoutShift([["A"], ["A"], ["B"], ["C"], ["C"]]),
      [makeItem("A", 0, 1, 1), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 1)],
      4
    );
    expect(exported).toEqual([makeItem("A", 0, 1, 2), makeItem("B", 0, 1, 1), makeItem("C", 0, 1, 2)]);
  });

  test("Scales 2-column layout to default when columns=2 and there are more than 2 item moves", () => {
    const exported = exportItemsLayout(
      makeLayoutShift(
        [
          ["A", "A"],
          ["B", "C"],
          [" ", "C"],
        ],
        [
          { itemId: "A", type: "MOVE", x: 0, y: 0, width: 0, height: 0 },
          { itemId: "B", type: "VACANT", x: 0, y: 0, width: 0, height: 0 },
          { itemId: "C", type: "VACANT", x: 0, y: 0, width: 0, height: 0 },
        ]
      ),
      [makeItem("A", 1, 1, 1), makeItem("B", 1, 1, 1), makeItem("C", 1, 1, 1)],
      2
    );
    expect(exported).toEqual([makeItem("A", 0, 4, 1), makeItem("B", 0, 2, 1), makeItem("C", 2, 2, 2)]);
  });

  test("Updates only affected items when columns=2 and there are 2 item moves", () => {
    const exported = exportItemsLayout(
      makeLayoutShift(
        [
          ["A", "A"],
          ["B", "C"],
          [" ", "C"],
        ],
        [
          { itemId: "A", type: "MOVE", x: 0, y: 0, width: 0, height: 0 },
          { itemId: "C", type: "VACANT", x: 0, y: 0, width: 0, height: 0 },
        ]
      ),
      [makeItem("A", 1, 1, 1), makeItem("B", 1, 1, 1), makeItem("C", 1, 1, 1)],
      2
    );
    expect(exported).toEqual([makeItem("A", 0, 4, 1), makeItem("B", 1, 1, 1), makeItem("C", 2, 2, 2)]);
  });

  test("Updates target item columnSpan and rowSpan when columns=2 and resize move was made", () => {
    const exported = exportItemsLayout(
      makeLayoutShift(
        [
          ["A", "A"],
          ["A", "A"],
          ["B", "C"],
          [" ", "C"],
        ],
        [{ itemId: "A", type: "RESIZE", x: 0, y: 0, width: 0, height: 0 }]
      ),
      [makeItem("A", 1, 1, 1), makeItem("B", 1, 1, 1), makeItem("C", 1, 1, 2)],
      2
    );
    expect(exported).toEqual([makeItem("A", 1, 4, 2), makeItem("B", 1, 1, 1), makeItem("C", 1, 1, 2)]);
  });

  test("Keeps items columnOffset and columnSpan when columns=1", () => {
    const exported = exportItemsLayout(
      makeLayoutShift([["A"], ["A"], ["B"], ["C"], ["C"]]),
      [makeItem("A", 0, 1, 1), makeItem("B", 1, 2, 1), makeItem("C", 2, 1, 1)],
      1
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
