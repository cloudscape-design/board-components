// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import { KeyCode } from "@cloudscape-design/test-utils-core/utils";

import { Board, BoardProps } from "../../../lib/components";
import BoardItem from "../../../lib/components/board-item";
import {
  mockBoardTransfer,
  mockController,
  mockDroppables,
} from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../lib/components/internal/dnd-controller/controller";
import { ItemId } from "../../../lib/components/internal/interfaces";
import { Coordinates } from "../../../lib/components/internal/utils/coordinates";
import createWrapper from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

import boardStyles from "../../../lib/components/board/styles.css.js";

vi.mock("../../../lib/components/internal/dnd-controller/controller");

afterEach(cleanup);

function getPlaceholderId(row: number, col: number): ItemId {
  const suffix = `-${row}-${col}`;
  const id = [...mockDroppables].find((droppableId) => String(droppableId).endsWith(suffix));
  if (!id) {
    throw new Error(`No placeholder droppable registered for row ${row}, col ${col}.`);
  }
  return id;
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

test("an empty board exposes a target and acquires a keyboard insert", () => {
  render(<Board {...defaultProps} items={[]} />);
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
      droppableId: getPlaceholderId(0, 0),
      draggableItem,
      renderAcquiredItem: () => <div data-testid="acquired-item"></div>,
    }),
  );

  expect(screen.queryByTestId("acquired-item")).toBeInTheDOM();
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

    // The board did not react: no placeholder shows hover state.
    expect(document.querySelectorAll(`.${boardStyles["placeholder--hover"]}`).length).toBe(0);
  });
});

describe("keyboard boundary transfer for acquired items", () => {
  const draggableItem = { id: "test", data: { title: "Test item" }, definition: {} };

  const itemI18nStrings = {
    dragHandleAriaLabel: "Drag handle",
    resizeHandleAriaLabel: "Resize handle",
  };

  // Starts a keyboard insert and acquires the item at placeholder (row 1, col 0), i.e. grid
  // position x=0. From x=0 pressing "left" always crosses the board's left boundary.
  function startInsertAndAcquire() {
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
        renderAcquiredItem: () => <BoardItem i18nStrings={itemI18nStrings}>Acquired</BoardItem>,
      }),
    );
  }

  function acquiredItemDragHandle() {
    return createWrapper().findBoard()!.findItemById("test")!.findDragHandle();
  }

  test("transfers the acquired item to a neighboring board when moving past the left boundary", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    // Expose a foreign droppable (as if another board is present on the page). In jsdom all
    // elements have zero-sized rects, which qualify as "left of" this board's item.
    const foreignElement = document.createElement("div");
    mockBoardTransfer.getDroppables.mockReturnValueOnce([
      ["awsui-placeholder-other-board-0-0", { element: foreignElement, context: {} }],
    ] as ReturnType<typeof mockBoardTransfer.getDroppables>);

    acquiredItemDragHandle().keydown(KeyCode.left);

    // The board transferred the item: acquire fired for the foreign droppable and the acquired state
    // was cleared silently, so the item is no longer rendered here.
    expect(mockBoardTransfer.acquire).toHaveBeenCalledWith("awsui-placeholder-other-board-0-0", expect.any(Function));
    expect(createWrapper().findBoard()!.findItemById("test")).toBeNull();
  });

  test("transfers past the logical start boundary with ArrowRight in RTL", () => {
    mockBoardTransfer.acquire.mockClear();
    render(
      <div style={{ direction: "rtl" }}>
        <Board {...defaultProps} />
      </div>,
    );
    startInsertAndAcquire();

    const acquiredItem = createWrapper().findBoard()!.findItemById("test")!.getElement();
    vi.spyOn(acquiredItem, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 200,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100,
    } as DOMRect);

    // In RTL the logical start edge is physically on the right. The target placeholder is therefore
    // to the right of the acquired item, while ArrowRight decrements its logical x coordinate.
    const foreignElement = document.createElement("div");
    foreignElement.style.direction = "rtl";
    vi.spyOn(foreignElement, "getBoundingClientRect").mockReturnValue({
      left: 200,
      right: 300,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100,
    } as DOMRect);
    mockBoardTransfer.getDroppables.mockReturnValueOnce([
      ["awsui-placeholder-other-board-0-0", { element: foreignElement, context: {} }],
    ] as ReturnType<typeof mockBoardTransfer.getDroppables>);

    acquiredItemDragHandle().keydown(KeyCode.right);

    expect(mockBoardTransfer.acquire).toHaveBeenCalledWith("awsui-placeholder-other-board-0-0", expect.any(Function));
  });

  test("preserves the item's row when transferring across a horizontal board boundary", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    const acquiredItem = createWrapper().findBoard()!.findItemById("test")!.getElement();
    vi.spyOn(acquiredItem, "getBoundingClientRect").mockReturnValue({
      left: 100,
      right: 200,
      top: 100,
      bottom: 200,
      width: 100,
      height: 100,
    } as DOMRect);

    const rowZeroElement = document.createElement("div");
    vi.spyOn(rowZeroElement, "getBoundingClientRect").mockReturnValue({
      left: -100,
      right: 0,
      top: 0,
      bottom: 100,
      width: 100,
      height: 100,
    } as DOMRect);
    const alignedRowElement = document.createElement("div");
    vi.spyOn(alignedRowElement, "getBoundingClientRect").mockReturnValue({
      left: -100,
      right: 0,
      top: 100,
      bottom: 200,
      width: 100,
      height: 100,
    } as DOMRect);

    mockBoardTransfer.getDroppables.mockReturnValueOnce([
      ["awsui-placeholder-other-board-0-0", { element: rowZeroElement, context: {} }],
      ["awsui-placeholder-other-board-1-0", { element: alignedRowElement, context: {} }],
    ] as ReturnType<typeof mockBoardTransfer.getDroppables>);

    acquiredItemDragHandle().keydown(KeyCode.left);

    expect(mockBoardTransfer.acquire).toHaveBeenCalledWith("awsui-placeholder-other-board-1-0", expect.any(Function));
  });

  test("re-acquires an item that was previously transferred out (transfer back)", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    // Transfer the item out to a neighboring board. The board keeps its insert transition but clears
    // the acquired state, allowing the same transition to receive the item again.
    const foreignElement = document.createElement("div");
    mockBoardTransfer.getDroppables.mockReturnValueOnce([
      ["awsui-placeholder-other-board-0-0", { element: foreignElement, context: {} }],
    ] as ReturnType<typeof mockBoardTransfer.getDroppables>);
    acquiredItemDragHandle().keydown(KeyCode.left);
    expect(createWrapper().findBoard()!.findItemById("test")).toBeNull();

    act(() =>
      mockController.acquire({
        droppableId: getPlaceholderId(1, 0),
        draggableItem,
        renderAcquiredItem: () => <BoardItem i18nStrings={itemI18nStrings}>Re-acquired</BoardItem>,
      }),
    );

    expect(createWrapper().findBoard()!.findItemById("test")).not.toBeNull();
  });

  test("keeps the acquired item at the boundary when there is no neighboring board", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    // Default mock getDroppables returns only this board's own placeholders, which are excluded
    // from transfer targets, so there is no foreign droppable to move to.
    acquiredItemDragHandle().keydown(KeyCode.left);

    expect(mockBoardTransfer.acquire).not.toHaveBeenCalled();
    expect(createWrapper().findBoard()!.findItemById("test")).not.toBeNull();
  });

  test("moves the acquired item within the board when not at a boundary", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    // A single down press from y=0 keeps the item inside the board's reserved rows.
    acquiredItemDragHandle().keydown(KeyCode.down);

    expect(mockBoardTransfer.acquire).not.toHaveBeenCalled();
    expect(createWrapper().findBoard()!.findItemById("test")).not.toBeNull();
  });

  test("stops the acquired item at the downward boundary to prevent infinite scroll", () => {
    mockBoardTransfer.acquire.mockClear();
    render(<Board {...defaultProps} />);
    startInsertAndAcquire();

    // The downward boundary is computed from layout data (maxRows), not DOM geometry, so it is
    // exercisable in jsdom. The board reserves a limited number of extra rows below existing content;
    // pressing down repeatedly must eventually hit the boundary (no transfer target, so the item
    // stays put). This prevents the unbounded grid growth that caused infinite scrolling.
    for (let i = 0; i < 20; i++) {
      acquiredItemDragHandle().keydown(KeyCode.down);
    }

    expect(createWrapper().findBoard()!.findItemById("test")).not.toBeNull();
    expect(mockBoardTransfer.acquire).not.toHaveBeenCalled();
  });

  test("arrow keys on a drag handle without an active transition are ignored", () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    // No transition was started, so onItemMove returns early: the arrow key must not move the item.
    const dragHandle = createWrapper().findBoard()!.findItemById("1")!.findDragHandle();
    dragHandle.keydown(KeyCode.down);

    expect(onItemsChange).not.toHaveBeenCalled();
  });
});

describe("pointer collision scoping", () => {
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

  function startReorder(collisionIds: ItemId[]) {
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

  function updateReorder(collisionIds: ItemId[]) {
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
