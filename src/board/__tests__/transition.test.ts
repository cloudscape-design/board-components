// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "vitest";
import { fromMatrix } from "../../internal/debug-tools";
import { Operation } from "../../internal/dnd-controller/controller";
import { GridLayout } from "../../internal/interfaces";
import { LayoutShift } from "../../internal/layout-engine/interfaces";
import { Transition, selectTransitionRows } from "../transition";

function createMockTransition(
  operation: Operation,
  itemsLayout: GridLayout,
  layoutShift: LayoutShift
): Transition<null> {
  return {
    operation,
    interactionType: "keyboard",
    itemsLayout,
    insertionDirection: null,
    draggableItem: { id: "X", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: null },
    draggableElement: null as unknown as HTMLElement,
    acquiredItem: null,
    collisionIds: new Set(),
    layoutShift,
    layoutShiftWithRefloat: null,
    path: [],
  };
}

describe("selectTransitionRows", () => {
  test("returns 0 if no transition", () => {
    const transition = null;
    const rows = selectTransitionRows({ transition, announcement: null });
    expect(rows).toBe(0);
  });

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
      }
    );
    const rows = selectTransitionRows({ transition, announcement: null });
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
      }
    );
    const rows = selectTransitionRows({ transition, announcement: null });
    expect(rows).toBe(3);
  });

  test("returns original amount of rows plus item height for reorder and insert", () => {
    const itemsLayout = fromMatrix([
      ["X", "X", "A", "A"],
      ["X", "X", "A", "A"],
      [" ", " ", "A", "A"],
    ]);
    const layoutShift = { current: itemsLayout, next: itemsLayout, moves: [], conflicts: [] };

    const reorderTransition = createMockTransition("reorder", itemsLayout, layoutShift);
    expect(selectTransitionRows({ transition: reorderTransition, announcement: null })).toBe(5);

    const insertTransition = createMockTransition("reorder", itemsLayout, layoutShift);
    expect(selectTransitionRows({ transition: insertTransition, announcement: null })).toBe(5);
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
    expect(selectTransitionRows({ transition: resizeTransition, announcement: null })).toBe(4);

    const reorderTransition = createMockTransition("reorder", current, { current, next, moves: [], conflicts: [] });
    expect(selectTransitionRows({ transition: reorderTransition, announcement: null })).toBe(4);

    const insertTransition = createMockTransition("insert", current, { current, next, moves: [], conflicts: [] });
    expect(selectTransitionRows({ transition: insertTransition, announcement: null })).toBe(4);
  });
});
