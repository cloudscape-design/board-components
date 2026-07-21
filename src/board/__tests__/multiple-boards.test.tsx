// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";

import TooltipWrapper from "@cloudscape-design/components/test-utils/dom/internal/tooltip";
import { KeyCode } from "@cloudscape-design/test-utils-core/utils";

import Board from "../../../lib/components/board";
import { BoardProps } from "../../../lib/components/board";
import createWrapper, { BoardWrapper } from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

// These tests exercise two boards rendered on the same page. They use the real (non-mocked) d&d
// controller so that cross-board isolation is validated end to end: both boards subscribe to the
// same singleton controller, so a drag started in one board must not disturb the other.

describe("Multiple boards on the same page", () => {
  beforeAll(() => {
    // jsdom does not support this function.
    document.elementFromPoint = () => null;
  });

  afterEach(() => {
    cleanup();
  });

  function TwoBoards({
    onItemsChangeA,
    onItemsChangeB,
  }: {
    onItemsChangeA?: BoardProps<{ title: string }>["onItemsChange"];
    onItemsChangeB?: BoardProps<{ title: string }>["onItemsChange"];
  }) {
    const [itemsA, setItemsA] = useState(defaultProps.items);
    const [itemsB, setItemsB] = useState<readonly BoardProps.Item<{ title: string }>[]>([
      { id: "b1", data: { title: "Item B1" } },
      { id: "b2", data: { title: "Item B2" } },
    ]);
    return (
      <>
        <div data-testid="board-a">
          <Board
            {...defaultProps}
            items={itemsA}
            onItemsChange={(event) => {
              setItemsA(event.detail.items);
              onItemsChangeA?.(event);
            }}
          />
        </div>
        <div data-testid="board-b">
          <Board
            {...defaultProps}
            items={itemsB}
            onItemsChange={(event) => {
              setItemsB(event.detail.items);
              onItemsChangeB?.(event);
            }}
          />
        </div>
      </>
    );
  }

  function boardA(): BoardWrapper {
    return createWrapper(document.querySelector('[data-testid="board-a"]')!).findBoard()!;
  }
  function boardB(): BoardWrapper {
    return createWrapper(document.querySelector('[data-testid="board-b"]')!).findBoard()!;
  }

  test("renders two independent boards", () => {
    render(<TwoBoards />);

    expect(boardA().findItemById("1")!.getElement().textContent).toContain("Item 1");
    expect(boardB().findItemById("b1")!.getElement().textContent).toContain("Item B1");
  });

  test("keyboard reorder in one board does not affect the other", () => {
    const onItemsChangeA = vi.fn();
    const onItemsChangeB = vi.fn();
    render(<TwoBoards onItemsChangeA={onItemsChangeA} onItemsChangeB={onItemsChangeB} />);

    // Reorder the first item down within board A.
    const dragHandle = boardA().findItemById("1")!.findDragHandle();
    dragHandle.keydown(KeyCode.enter);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.enter);

    // Board A committed a reorder.
    expect(onItemsChangeA).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          movedItem: expect.objectContaining({ id: "1" }),
          items: [expect.objectContaining({ id: "2" }), expect.objectContaining({ id: "1" })],
        }),
      }),
    );

    // Board B was never disturbed.
    expect(onItemsChangeB).not.toHaveBeenCalled();
  });

  test("keyboard resize in one board does not affect the other", () => {
    const onItemsChangeA = vi.fn();
    const onItemsChangeB = vi.fn();
    render(<TwoBoards onItemsChangeA={onItemsChangeA} onItemsChangeB={onItemsChangeB} />);

    const resizeHandle = boardA().findItemById("1")!.findResizeHandle()!;
    resizeHandle.keydown(KeyCode.enter);
    resizeHandle.keydown(KeyCode.down);
    resizeHandle.keydown(KeyCode.down);
    resizeHandle.keydown(KeyCode.enter);

    expect(onItemsChangeA).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({ resizedItem: expect.objectContaining({ id: "1" }) }),
      }),
    );
    expect(onItemsChangeB).not.toHaveBeenCalled();
  });

  test("removing an item from one board does not affect the other", async () => {
    const onItemsChangeA = vi.fn();
    const onItemsChangeB = vi.fn();
    render(<TwoBoards onItemsChangeA={onItemsChangeA} onItemsChangeB={onItemsChangeB} />);

    const removeButton = boardA().findItemById("1")!.findSettings()!.find('[data-testid="remove-button"]')!;
    removeButton.click();

    await waitFor(() =>
      expect(onItemsChangeA).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ removedItem: expect.objectContaining({ id: "1" }) }),
        }),
      ),
    );
    expect(onItemsChangeB).not.toHaveBeenCalled();
  });

  test("each board keeps its own items after an interaction", () => {
    render(<TwoBoards />);

    const dragHandle = boardA().findItemById("1")!.findDragHandle();
    dragHandle.keydown(KeyCode.enter);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.enter);

    // Board B still renders exactly its own items and none from board A.
    // Note: findItemById searches the whole document, so scope the lookup to board B's element.
    expect(boardB().find('[data-item-id="b1"]')).not.toBeNull();
    expect(boardB().find('[data-item-id="b2"]')).not.toBeNull();
    expect(boardB().find('[data-item-id="1"]')).toBeNull();
    expect(boardB().find('[data-item-id="2"]')).toBeNull();
  });

  // AWSUI-62123 bug bash finding #1: while dragging an item, hovering another item's drag handle
  // (on the same or another board — they share one controller) used to surface that handle's
  // "Drag or select to move" tooltip, which is confusing mid-drag. The tooltip is only meaningful at
  // rest, so it is suppressed for every board item while any drag transition is active.
  describe("drag handle tooltip during an active drag", () => {
    function hover(element: HTMLElement) {
      fireEvent(element, new MouseEvent("pointerover", { bubbles: true }));
    }

    test("shows the handle tooltip on hover when no drag is active", () => {
      render(<TwoBoards />);
      hover(boardB().findItemById("b1")!.findDragHandle().getElement());
      expect(createWrapper().findByClassName(TooltipWrapper.rootSelector)).not.toBeNull();
    });

    test("suppresses the handle tooltip on another board while a drag is active", () => {
      render(<TwoBoards />);

      // Start (but do not submit) a keyboard reorder in board A.
      boardA().findItemById("1")!.findDragHandle().keydown(KeyCode.enter);

      // Hovering board B's handle must not surface its tooltip mid-drag.
      hover(boardB().findItemById("b1")!.findDragHandle().getElement());
      expect(createWrapper().findByClassName(TooltipWrapper.rootSelector)).toBeNull();
    });

    test("restores the handle tooltip after the drag ends", () => {
      render(<TwoBoards />);

      const dragHandle = boardA().findItemById("1")!.findDragHandle();
      dragHandle.keydown(KeyCode.enter);
      dragHandle.keydown(KeyCode.escape);

      hover(boardB().findItemById("b1")!.findDragHandle().getElement());
      expect(createWrapper().findByClassName(TooltipWrapper.rootSelector)).not.toBeNull();
    });
  });
});
