// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";

import { fromMatrix } from "../../../internal/debug-tools";
import { Operation } from "../../../internal/dnd-controller/controller";
import { GridLayout } from "../../../internal/interfaces";
import { LayoutEngine } from "../../../internal/layout-engine/engine";
import { LayoutShift } from "../../../internal/layout-engine/interfaces";
import { Transition } from "../../internal-interfaces";
import { getLayoutRows } from "../layout";

function createMockTransition(
  operation: Operation,
  itemsLayout: GridLayout,
  layoutShift: LayoutShift,
): Transition<null> {
  return {
    operation,
    acquiredItem: null,
    interactionType: "keyboard",
    boardId: "test-board",
    itemsLayout,
    layoutEngine: new LayoutEngine(itemsLayout),
    insertionDirection: null,
    draggableItem: { id: "X", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: null },
    draggableRect: { left: 0, right: 0, top: 0, bottom: 0 },
    collisionIds: new Set(),
    layoutShift,
    path: [],
  };
}

describe("getLayoutRows", () => {
  test("returns original amount of rows for resize when not reached bottom", () => {
    const transition = createMockTransition(
      "resize",
      fromMatrix([
        ["X", "X", "A", "A"],
        [" ", " ", "A", "A"],
      ]),
      {
        current: fromMatrix([
          ["X", "X", "A", "A"],
          [" ", " ", "A", "A"],
        ]),
        next: fromMatrix([
          ["X", "X", "A", "A"],
          [" ", " ", "A", "A"],
        ]),
        moves: [],
        conflicts: [],
      },
    );
    const rows = getLayoutRows(transition);
    expect(rows).toBe(2);
  });

  test("returns original amount of rows plus one for resize when reached bottom", () => {
    const transition = createMockTransition(
      "resize",
      fromMatrix([
        ["X", "X", "A", "A"],
        [" ", " ", "A", "A"],
      ]),
      {
        current: fromMatrix([
          ["X", "X", "A", "A"],
          [" ", " ", "A", "A"],
        ]),
        next: fromMatrix([
          ["X", "X", "A", "A"],
          ["X", "X", "A", "A"],
        ]),
        moves: [],
        conflicts: [],
      },
    );
    const rows = getLayoutRows(transition);
    expect(rows).toBe(3);
  });

  test("returns original amount of rows plus item height for reorder and insert", () => {
    const itemsLayout = fromMatrix([
      ["X", "X", "A", "A"],
      ["X", "X", "A", "A"],
      [" ", " ", "A", "A"],
    ]);
    const layoutShift = { current: itemsLayout, next: itemsLayout, moves: [], conflicts: [] };

    expect(getLayoutRows(createMockTransition("reorder", itemsLayout, layoutShift))).toBe(5);

    expect(getLayoutRows(createMockTransition("reorder", itemsLayout, layoutShift))).toBe(5);
  });

  test("returns next layout amount of rows if it is bigger", () => {
    const current = fromMatrix([
      ["X", "A"],
      [" ", "A"],
    ]);
    const next = fromMatrix([
      ["X", "A"],
      [" ", "A"],
      [" ", "A"],
      [" ", "A"],
    ]);

    const resizeTransition = createMockTransition("resize", current, { current, next, moves: [], conflicts: [] });
    expect(getLayoutRows(resizeTransition)).toBe(4);

    const reorderTransition = createMockTransition("reorder", current, { current, next, moves: [], conflicts: [] });
    expect(getLayoutRows(reorderTransition)).toBe(4);

    const insertTransition = createMockTransition("insert", current, { current, next, moves: [], conflicts: [] });
    expect(getLayoutRows(insertTransition)).toBe(4);
  });

  describe("insert row scoping for multiple boards", () => {
    const itemsLayout = fromMatrix([
      ["A", "A"],
      ["A", "A"],
      ["B", "B"],
    ]);

    function createInsertTransition(interactionType: "pointer" | "keyboard", layout = itemsLayout) {
      const shift: LayoutShift = { current: layout, next: layout, moves: [], conflicts: [] };
      return { ...createMockTransition("insert", layout, shift), interactionType };
    }

    test("a keyboard insert does not grow a board that has not acquired the item", () => {
      expect(getLayoutRows(createInsertTransition("keyboard"))).toBe(3);
    });

    test("a keyboard insert grows the board once it has acquired the item", () => {
      const transition = createInsertTransition("keyboard");
      transition.acquiredItem = { id: "X", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: null };
      // Item default row span is 2, so rows grow from 3 to 3 + 2 = 5.
      expect(getLayoutRows(transition)).toBe(5);
    });

    test("an empty board reserves keyboard landing rows so it is a reachable target", () => {
      const emptyLayout: GridLayout = { items: [], columns: 2, rows: 0 };
      // Item default row span is 2, so an empty board still exposes 0 + 2 = 2 rows to navigate onto.
      expect(getLayoutRows(createInsertTransition("keyboard", emptyLayout))).toBe(2);
    });

    test("a pointer insert still grows on start (drop-zone affordance is preserved)", () => {
      // Pointer inserts are unchanged: the board pre-reserves rows even before any collision so the
      // user sees where the held item can drop.
      expect(getLayoutRows(createInsertTransition("pointer"))).toBe(5);
    });
  });
});
