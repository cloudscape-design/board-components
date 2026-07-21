// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { Board, BoardProps } from "../../../lib/components";
import { mockController, mockDroppables } from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../lib/components/internal/dnd-controller/controller";
import { Coordinates } from "../../../lib/components/internal/utils/coordinates";
import createWrapper from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

import boardStyles from "../../../lib/components/board/styles.css.js";

vi.mock("../../../lib/components/internal/dnd-controller/controller");

// Placeholder droppable IDs are scoped with a runtime-generated boardId
// (`awsui-placeholder-<boardId>-<row>-<col>`), so resolve the target placeholder by its row/col
// suffix instead of hardcoding the full ID.
afterEach(cleanup);

function getPlaceholderId(row: number, col: number): string {
  const suffix = `-${row}-${col}`;
  const id = [...mockDroppables].find((droppableId) => String(droppableId).endsWith(suffix));
  if (!id) {
    throw new Error(`No placeholder droppable registered for row ${row}, col ${col}.`);
  }
  return String(id);
}

test("renders acquired item", () => {
  render(<Board {...defaultProps} />);
  expect(screen.queryByTestId("acquired-item")).toBeNull();
  const draggableItem = { id: "test", data: { title: "Test item" }, definition: {} };

  act(() =>
    mockController.start({
      interactionType: "keyboard",
      operation: "insert",
      draggableItem,
      collisionRect: { top: 0, bottom: 0, left: 0, right: 0 },
      coordinates: new Coordinates({ x: 0, y: 0 }),
    } as DragAndDropData),
  );

  act(() =>
    mockController.acquire({
      droppableId: getPlaceholderId(1, 0),
      draggableItem,
      renderAcquiredItem: () => <div data-testid="acquired-item"></div>,
    }),
  );
  expect(screen.queryByTestId("acquired-item")).toBeInTheDOM();

  act(() => mockController.discard());
  expect(screen.queryByTestId("acquired-item")).toBeNull();
});

test("ignores acquire for a droppable that belongs to another board", () => {
  render(<Board {...defaultProps} />);
  const draggableItem = { id: "test", data: { title: "Test item" }, definition: {} };

  act(() =>
    mockController.start({
      interactionType: "keyboard",
      operation: "insert",
      draggableItem,
      collisionRect: { top: 0, bottom: 0, left: 0, right: 0 },
      coordinates: new Coordinates({ x: 0, y: 0 }),
    } as DragAndDropData),
  );

  act(() =>
    mockController.acquire({
      droppableId: "awsui-placeholder-other-board-1-0",
      draggableItem,
      renderAcquiredItem: () => <div data-testid="acquired-item"></div>,
    }),
  );

  expect(screen.queryByTestId("acquired-item")).toBeNull();
});

function StatefulBoard(props: BoardProps<{ title: string }>) {
  const [items, setItems] = useState(props.items);
  return <Board {...props} items={items} onItemsChange={({ detail }) => setItems(detail.items)} />;
}

test("focuses on acquired item's drag handle upon submission", () => {
  render(<StatefulBoard {...defaultProps} />);
  const draggableItem = { id: "test", data: { title: "Test item" }, definition: {} };

  act(() =>
    mockController.start({
      interactionType: "keyboard",
      operation: "insert",
      draggableItem,
      collisionRect: { top: 0, bottom: 0, left: 0, right: 0 },
      coordinates: new Coordinates({ x: 0, y: 0 }),
    } as DragAndDropData),
  );

  act(() =>
    mockController.acquire({
      droppableId: getPlaceholderId(1, 0),
      draggableItem,
      renderAcquiredItem: () => <div></div>,
    }),
  );

  act(() => mockController.submit());
  expect(createWrapper().findBoard()!.findItemById("test")!.findDragHandle().getElement()).toHaveFocus();
});

describe("start event ownership filtering", () => {
  const zeroRect = { top: 0, bottom: 0, left: 0, right: 0 };

  test("ignores reorder/resize events for items not owned by this board", () => {
    render(<Board {...defaultProps} />);
    const foreignItem = { id: "foreign-item", data: { title: "Foreign" }, definition: {} };

    // A reorder start for an item that does not belong to this board should not crash or create
    // a transition (the board should early-return from the handler).
    act(() =>
      mockController.start({
        interactionType: "keyboard",
        operation: "reorder",
        draggableItem: foreignItem,
        collisionRect: zeroRect,
        coordinates: new Coordinates({ x: 0, y: 0 }),
      } as DragAndDropData),
    );

    // The board did not react — no placeholder shows hover state.
    expect(document.querySelectorAll(`.${boardStyles["placeholder--hover"]}`).length).toBe(0);

    // Submitting should be safe (no-op).
    act(() => mockController.submit());
  });

  test("does not filter insert events even for foreign items", () => {
    render(<Board {...defaultProps} />);
    const paletteItem = { id: "palette-item", data: { title: "From palette" }, definition: {} };

    // Insert operations from a palette can target any board, so they must not be filtered.
    act(() =>
      mockController.start({
        interactionType: "keyboard",
        operation: "insert",
        draggableItem: paletteItem,
        collisionRect: zeroRect,
        coordinates: new Coordinates({ x: 0, y: 0 }),
      } as DragAndDropData),
    );

    // The board accepted the event — discard cleans up without error.
    act(() => mockController.discard());
  });
});

describe("pointer collision scoping", () => {
  // isElementOverBoard relies on elementFromPoint; jsdom has no layout, so point it at the board.
  let boardElement: Element | null = null;
  beforeAll(() => {
    document.elementFromPoint = () => boardElement;
  });
  afterAll(() => {
    boardElement = null;
  });

  function hoveredPlaceholderCount() {
    return document.querySelectorAll(`.${boardStyles["placeholder--hover"]}`).length;
  }

  const draggableItem = { id: "1", data: { title: "Item 1" }, definition: {} };
  const zeroRect = { top: 0, bottom: 0, left: 0, right: 0 };

  function startReorder(collisionIds: string[]) {
    act(() =>
      mockController.start({
        interactionType: "pointer",
        operation: "reorder",
        draggableItem,
        collisionRect: zeroRect,
        coordinates: new Coordinates({ x: 0, y: 0 }),
        collisionIds,
        positionOffset: new Coordinates({ x: 0, y: 0 }),
        dropTarget: null,
      } as unknown as DragAndDropData),
    );
  }

  function updateReorder(collisionIds: string[]) {
    act(() =>
      mockController.update({
        interactionType: "pointer",
        operation: "reorder",
        draggableItem,
        collisionRect: zeroRect,
        coordinates: new Coordinates({ x: 0, y: 0 }),
        positionOffset: new Coordinates({ x: 0, y: 0 }),
        dropTarget: null,
        collisionIds,
      } as unknown as DragAndDropData),
    );
  }

  test("ignores pointer collision ids that belong to another board", () => {
    const { container } = render(<Board {...defaultProps} />);
    boardElement = container.querySelector(`.${boardStyles.root}`);

    startReorder([]);
    updateReorder(["awsui-placeholder-other-board-0-0"]);

    // The foreign id was filtered out, so this board highlights nothing and does not crash.
    expect(hoveredPlaceholderCount()).toBe(0);
  });

  // Regression for the "infinite loop in appendPath" crash: collisions that do not map onto this
  // board's placeholder grid must never seed or extend the transition path. Before the fix, an
  // unmatched collision produced an Infinity rect that poisoned the path, so the next matching
  // update looped forever. Feeding an unmatched collision first, then a matching one, must not throw.
  test("does not crash when an unmatched collision precedes a matching one", () => {
    const { container } = render(<Board {...defaultProps} />);
    boardElement = container.querySelector(`.${boardStyles.root}`);

    expect(() => {
      startReorder(["awsui-placeholder-other-board-0-0"]);
      updateReorder(["awsui-placeholder-other-board-1-1"]);
      updateReorder([getPlaceholderId(0, 0)]);
    }).not.toThrow();
  });
});
