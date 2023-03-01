// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "vitest";
import { fromMatrix, toString } from "../../debug-tools";
import { BoardItemDefinition, BoardItemDefinitionBase, BoardItemLayoutSetting } from "../../interfaces";
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
  columnOffset?: BoardItemLayoutSetting;
  columnSpan?: BoardItemLayoutSetting;
  rowSpan?: BoardItemLayoutSetting;
}

function makeItem(id: string, definition: Definition = {}, placement: Placement = {}): BoardItemDefinition<unknown> {
  return { id, definition, ...placement, data: null };
}

describe("interpretItems", () => {
  test("item column span and row span cannot be smaller their min settings", () => {
    const grid = interpretItems(
      [makeItem("A", { minColumnSpan: { 4: 2 }, minRowSpan: 3 }, { columnSpan: { 4: 1 }, rowSpan: { 4: 2 } })],
      4
    );
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
    const grid = interpretItems(
      [makeItem("A", {}, { rowSpan: { 3: 4 } }), makeItem("B"), makeItem("C"), makeItem("D")],
      3
    );
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
        makeItem("A", {}, { rowSpan: { 3: 2 } }),
        makeItem("B", {}, { rowSpan: { 3: 6 } }),
        makeItem("C", {}, { rowSpan: { 3: 5 } }),
        makeItem("D", {}, { rowSpan: { 3: 2 } }),
        makeItem("E", {}, { rowSpan: { 3: 2 } }),
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
      ])
    );
    expect(items.map((it) => it.id)).toEqual(["D", "B", "C", "A"]);
  });

  test("items settings in the given layout match the grid", () => {
    const items = transformItems(
      [makeItem("A"), makeItem("B"), makeItem("C"), makeItem("D")],
      fromMatrix([
        ["D", "B", "C"],
        ["D", "B", "C"],
        ["D", "A", " "],
        ["D", "A", " "],
      ])
    );
    expect(items[0]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 0 }, columnSpan: { 3: 1 }, rowSpan: { 3: 4 } })
    );
    expect(items[1]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 1 }, columnSpan: { 3: 1 }, rowSpan: { 3: 2 } })
    );
    expect(items[2]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 2 }, columnSpan: { 3: 1 }, rowSpan: { 3: 2 } })
    );
    expect(items[3]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 1 }, columnSpan: { 3: 1 }, rowSpan: { 3: 2 } })
    );
  });

  test("items settings in the other layouts keep settings if indices remain the same", () => {
    const items = transformItems(
      [
        makeItem("A", {}, { columnOffset: { 6: 0 }, columnSpan: { 6: 3 }, rowSpan: { 6: 3 } }),
        makeItem("B", {}, { columnOffset: { 6: 2 }, columnSpan: { 6: 3 }, rowSpan: { 6: 3 } }),
      ],
      fromMatrix([
        ["A", "B", " "],
        ["A", "B", " "],
      ])
    );
    expect(items[0]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 0, 6: 0 }, columnSpan: { 3: 1, 6: 3 }, rowSpan: { 3: 2, 6: 3 } })
    );
    expect(items[1]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 1, 6: 2 }, columnSpan: { 3: 1, 6: 3 }, rowSpan: { 3: 2, 6: 3 } })
    );
  });

  test("items settings in the other layouts have offsets invalidated from the first index diff", () => {
    const items = transformItems(
      [
        makeItem("A", {}, { columnOffset: { 6: 0 }, columnSpan: { 6: 3 }, rowSpan: { 6: 3 } }),
        makeItem("B", {}, { columnOffset: { 6: 2 }, columnSpan: { 6: 3 }, rowSpan: { 6: 3 } }),
        makeItem("C", {}, { columnOffset: { 6: 4 }, columnSpan: { 6: 3 }, rowSpan: { 6: 3 } }),
      ],
      fromMatrix([
        ["A", "C", "B"],
        ["A", "C", "B"],
      ])
    );
    expect(items[0]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 0, 6: 0 }, columnSpan: { 3: 1, 6: 3 }, rowSpan: { 3: 2, 6: 3 } })
    );
    expect(items[1]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 1 }, columnSpan: { 3: 1, 6: 3 }, rowSpan: { 3: 2, 6: 3 } })
    );
    expect(items[2]).toEqual(
      expect.objectContaining({ columnOffset: { 3: 2 }, columnSpan: { 3: 1, 6: 3 }, rowSpan: { 3: 2, 6: 3 } })
    );
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
    expect(getMinColumnSpan(makeItem("A", { minColumnSpan: { 4: 3 } }), 4)).toBe(3);
    expect(getDefaultColumnSpan(makeItem("A", { defaultColumnSpan: { 4: 3 } }), 4)).toBe(3);
    expect(getMinRowSpan(makeItem("A", { minRowSpan: 3 }))).toBe(3);
    expect(getDefaultRowSpan(makeItem("A", { defaultRowSpan: 3 }))).toBe(3);
  });

  test("default setting cannot be smaller than min setting", () => {
    expect(getDefaultColumnSpan(makeItem("A", { defaultColumnSpan: { 4: 0 } }), 4)).toBe(1);
    expect(getDefaultColumnSpan(makeItem("A", { minColumnSpan: { 4: 3 }, defaultColumnSpan: { 4: 2 } }), 4)).toBe(3);
    expect(getDefaultRowSpan(makeItem("A", { defaultRowSpan: 1 }))).toBe(2);
    expect(getDefaultRowSpan(makeItem("A", { minRowSpan: 3, defaultRowSpan: 2 }))).toBe(3);
  });

  test("column span settings can be inherited from smaller layouts", () => {
    expect(getMinColumnSpan(makeItem("A", { minColumnSpan: { 4: 3 } }), 6)).toBe(3);
    expect(getDefaultColumnSpan(makeItem("A", { minColumnSpan: { 2: 2 } }), 6)).toBe(2);
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
