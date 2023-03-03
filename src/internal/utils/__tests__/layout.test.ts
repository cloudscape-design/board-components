// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { BoardItemColumnOffset, BoardItemDefinition, BoardItemDefinitionBase } from "../../interfaces";
import {
  createPlaceholdersLayout,
  getDefaultColumnSpan,
  getDefaultRowSpan,
  getMinColumnSpan,
  getMinRowSpan,
  interpretItems,
  transformItems,
} from "../layout";

type Definition = BoardItemDefinitionBase["definition"];

interface Placement {
  columnOffset?: BoardItemColumnOffset;
  columnSpan?: number;
  rowSpan?: number;
}

function makeItem(id: string, definition: Definition = {}, placement: Placement = {}): BoardItemDefinition<unknown> {
  return { id, definition, ...placement, data: null };
}

describe("interpretItems", () => {
  test("item column span and row span cannot be smaller their min settings", () => {
    const grid = interpretItems([makeItem("A", { minColumnSpan: 2, minRowSpan: 3 }, { columnSpan: 1, rowSpan: 2 })], 4);
    expect(grid.items[0].width).toBe(2);
    expect(grid.items[0].height).toBe(3);
  });

  test("item column offset is taken from its settings if defined", () => {
    const grid = interpretItems([makeItem("A", {}, { columnOffset: { 4: 2 } })], 4);
    expect(grid.items[0].x).toBe(2);
  });

  test("default incremental column offset is assigned when no column offset setting is present", () => {
    const grid = interpretItems([makeItem("A"), makeItem("B"), makeItem("C"), makeItem("D")], 3);
    expect(toString(grid)).toBe(
      toString([
        ["A", "B", "C"],
        ["A", "B", "C"],
        ["D", " ", " "],
        ["D", " ", " "],
      ])
    );
  });

  test("default column offset fills in gaps ahead", () => {
    const grid = interpretItems([makeItem("A", {}, { rowSpan: 4 }), makeItem("B"), makeItem("C"), makeItem("D")], 3);
    expect(toString(grid)).toBe(
      toString([
        ["A", "B", "C"],
        ["A", "B", "C"],
        ["A", "D", " "],
        ["A", "D", " "],
      ])
    );
  });

  test("default column offset fills in gaps before", () => {
    const grid = interpretItems(
      [
        makeItem("A", {}, { rowSpan: 2 }),
        makeItem("B", {}, { rowSpan: 6 }),
        makeItem("C", {}, { rowSpan: 5 }),
        makeItem("D", {}, { rowSpan: 2 }),
        makeItem("E", {}, { rowSpan: 2 }),
      ],
      3
    );
    expect(toString(grid)).toBe(
      toString([
        ["A", "B", "C"],
        ["A", "B", "C"],
        ["D", "B", "C"],
        ["D", "B", "C"],
        ["E", "B", "C"],
        ["E", "B", " "],
      ])
    );
  });
});

describe("transformItems", () => {
  test("items order is updated", () => {
    const items = transformItems(
      [makeItem("A"), makeItem("B"), makeItem("C"), makeItem("D")],
      fromMatrix([
        ["D", "B", "C"],
        ["D", "B", "C"],
        ["D", "A", " "],
        ["D", "A", " "],
      ]),
      null
    );
    expect(items.map((it) => it.id)).toEqual(["D", "B", "C", "A"]);
  });

  test("items order in the given layout match the grid", () => {
    const items = transformItems(
      [makeItem("A"), makeItem("B"), makeItem("C"), makeItem("D")],
      fromMatrix([
        ["D", "B", "C"],
        ["D", "B", "C"],
        ["D", "A", " "],
        ["D", "A", " "],
      ]),
      null
    );
    expect(items[0]).toEqual(expect.objectContaining({ columnOffset: { 3: 0 } }));
    expect(items[1]).toEqual(expect.objectContaining({ columnOffset: { 3: 1 } }));
    expect(items[2]).toEqual(expect.objectContaining({ columnOffset: { 3: 2 } }));
    expect(items[3]).toEqual(expect.objectContaining({ columnOffset: { 3: 1 } }));
  });

  test("items settings in the other layouts have offsets invalidated from the first index diff", () => {
    const items = transformItems(
      [
        makeItem("A", {}, { columnOffset: { 6: 0 }, columnSpan: 3, rowSpan: 3 }),
        makeItem("B", {}, { columnOffset: { 6: 2 }, columnSpan: 3, rowSpan: 3 }),
        makeItem("C", {}, { columnOffset: { 6: 4 }, columnSpan: 3, rowSpan: 3 }),
      ],
      fromMatrix([
        ["A", "C", "B"],
        ["A", "C", "B"],
      ]),
      null
    );
    expect(items[0]).toEqual(expect.objectContaining({ columnOffset: { 3: 0, 6: 0 }, columnSpan: 3, rowSpan: 3 }));
    expect(items[1]).toEqual(expect.objectContaining({ columnOffset: { 3: 1 }, columnSpan: 3, rowSpan: 3 }));
    expect(items[2]).toEqual(expect.objectContaining({ columnOffset: { 3: 2 }, columnSpan: 3, rowSpan: 3 }));
  });

  test("resize target size is updated but other items remain unchanged", () => {
    const items = transformItems(
      [
        makeItem("A", { minColumnSpan: 3, defaultRowSpan: 3 }),
        makeItem("B", {}, { columnSpan: 1, rowSpan: 2 }),
        makeItem("C", {}, { columnSpan: 1, rowSpan: 2 }),
      ],
      fromMatrix([
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["A", "A", "A"],
        ["B", "C", "C"],
        ["B", "C", "C"],
      ]),
      "C"
    );
    expect(items[0]).toEqual(expect.objectContaining({ columnOffset: { 3: 0 } }));
    expect(items[1]).toEqual(expect.objectContaining({ columnOffset: { 3: 0 }, columnSpan: 1, rowSpan: 2 }));
    expect(items[2]).toEqual(expect.objectContaining({ columnOffset: { 3: 1 }, columnSpan: 2, rowSpan: 2 }));
  });
});

describe("item setting getters", () => {
  test("setting getters return min values when the setting is not defined", () => {
    expect(getMinColumnSpan(makeItem("A"), 4)).toBe(1);
    expect(getDefaultColumnSpan(makeItem("A"), 4)).toBe(1);
    expect(getMinRowSpan(makeItem("A"))).toBe(2);
    expect(getDefaultRowSpan(makeItem("A"))).toBe(2);
  });

  test("setting getters return actual values when defined", () => {
    expect(getMinColumnSpan(makeItem("A", { minColumnSpan: 3 }), 4)).toBe(3);
    expect(getDefaultColumnSpan(makeItem("A", { defaultColumnSpan: 3 }), 4)).toBe(3);
    expect(getMinRowSpan(makeItem("A", { minRowSpan: 3 }))).toBe(3);
    expect(getDefaultRowSpan(makeItem("A", { defaultRowSpan: 3 }))).toBe(3);
  });

  test("default setting cannot be smaller than min setting", () => {
    expect(getDefaultColumnSpan(makeItem("A", { defaultColumnSpan: 0 }), 4)).toBe(1);
    expect(getDefaultColumnSpan(makeItem("A", { minColumnSpan: 3, defaultColumnSpan: 2 }), 4)).toBe(3);
    expect(getDefaultRowSpan(makeItem("A", { defaultRowSpan: 1 }))).toBe(2);
    expect(getDefaultRowSpan(makeItem("A", { minRowSpan: 3, defaultRowSpan: 2 }))).toBe(3);
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
