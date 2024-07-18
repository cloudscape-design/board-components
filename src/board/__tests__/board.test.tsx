// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { vi } from "vitest";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";

import { KeyCode } from "@cloudscape-design/test-utils-core/utils";

import Board from "../../../lib/components/board";
import createWrapper from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

import dragHandleStyles from "../../../lib/components/internal/drag-handle/styles.css.js";
import globalStateStyles from "../../../lib/components/internal/global-drag-state-styles/styles.css.js";
import resizeHandleStyles from "../../../lib/components/internal/resize-handle/styles.css.js";

describe("Board", () => {
  beforeAll(() => {
    // jsdom does not support this function
    document.elementFromPoint = () => null;
  });

  afterEach(() => {
    cleanup();
  });

  test("renders empty board", () => {
    render(<Board {...defaultProps} items={[]} />);
    const wrapper = createWrapper().findBoard()!;

    expect(wrapper.getElement().textContent).toBe("No items");
  });

  test("renders board with items", () => {
    render(<Board {...defaultProps} renderItem={(item) => <div>{item.data.title}</div>} />);
    const item = createWrapper().findBoard()!.findItemById("2")!;

    expect(item.getElement().textContent).toBe("Item 2");
  });

  test("pressing 'Escape' when there is no transition does not cause errors", () => {
    render(<Board {...defaultProps} />);
    const itemDragHandle = createWrapper().findBoard()!.findItemById("2")!.findDragHandle();

    itemDragHandle.focus();
    itemDragHandle.keydown(KeyCode.escape);
  });

  test("applies reorder operation classname", () => {
    const { container } = render(<Board {...defaultProps} />);

    const reorderClass = globalStateStyles["show-grab-cursor"];
    expect(container.ownerDocument.body).not.toHaveClass(reorderClass);

    const handle = createWrapper().findBoardItem()!.findDragHandle()!.getElement();

    // Start a reorder operation and check that the class is set
    fireEvent(handle, new MouseEvent("pointerdown", { bubbles: true }));
    expect(container.ownerDocument.body).toHaveClass(reorderClass);

    // Release pointer and check that the class is not set
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
    expect(container.ownerDocument.body).not.toHaveClass(reorderClass);
  });

  test("applies resize operation classname", () => {
    const { container } = render(<Board {...defaultProps} />);

    const resizeClass = globalStateStyles["show-resize-cursor"];
    expect(container.ownerDocument.body).not.toHaveClass(resizeClass);

    const handle = createWrapper().findBoardItem()!.findResizeHandle()!.getElement();

    // Start a resize operation and check that the class is set
    fireEvent(handle, new MouseEvent("pointerdown", { bubbles: true }));
    expect(container.ownerDocument.body).toHaveClass(resizeClass);

    // Release pointer and check that the class is not set
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
    expect(container.ownerDocument.body).not.toHaveClass(resizeClass);
  });

  test("applies pointer interaction class name", () => {
    const { container } = render(<Board {...defaultProps} />);

    const disableSelectionClass = globalStateStyles["disable-selection"];
    expect(container.ownerDocument.body).not.toHaveClass(disableSelectionClass);

    const handle = createWrapper().findBoardItem()!.findDragHandle()!.getElement();

    fireEvent(handle, new MouseEvent("pointerdown", { bubbles: true }));
    expect(container.ownerDocument.body).toHaveClass(disableSelectionClass);

    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
    expect(container.ownerDocument.body).not.toHaveClass(disableSelectionClass);
  });

  test("does not apply pointer class when keyboard is used", () => {
    const { container } = render(<Board {...defaultProps} />);
    const dragHandle = createWrapper().findBoardItem()!.findDragHandle()!;
    const disableSelectionClass = globalStateStyles["disable-selection"];

    dragHandle.keydown(KeyCode.enter);
    expect(container.ownerDocument.body).not.toHaveClass(disableSelectionClass);

    dragHandle.keydown(KeyCode.down);
    expect(container.ownerDocument.body).not.toHaveClass(disableSelectionClass);

    dragHandle.keydown(KeyCode.enter);
    expect(container.ownerDocument.body).not.toHaveClass(disableSelectionClass);
  });

  test("sets active state for drag handle", () => {
    render(<Board {...defaultProps} />);

    const findBoardItem = () => createWrapper().findBoard()!.findItemById("1")!;
    const findDragHandle = () => findBoardItem().findDragHandle().getElement();
    const findResizeHandle = () => findBoardItem().findResizeHandle().getElement();

    expect(findDragHandle()).not.toHaveClass(dragHandleStyles.active);

    // Start operation
    fireEvent(findDragHandle(), new MouseEvent("pointerdown", { bubbles: true }));
    expect(findDragHandle()).toHaveClass(dragHandleStyles.active);
    expect(findResizeHandle()).not.toHaveClass(dragHandleStyles.active);

    // End operation
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
    expect(findDragHandle()).not.toHaveClass(dragHandleStyles.active);
  });

  test("sets active state for resize handle", () => {
    render(<Board {...defaultProps} />);

    const dragHandle = createWrapper().findBoardItem()!.findDragHandle()!.getElement();
    const resizeHandle = createWrapper().findBoardItem()!.findResizeHandle()!.getElement();

    expect(resizeHandle).not.toHaveClass(resizeHandleStyles.active);

    // Start operation
    fireEvent(resizeHandle, new MouseEvent("pointerdown", { bubbles: true }));
    expect(resizeHandle).toHaveClass(resizeHandleStyles.active);
    expect(dragHandle).not.toHaveClass(resizeHandleStyles.active);

    // End operation
    fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
    expect(resizeHandle).not.toHaveClass(resizeHandleStyles.active);
  });

  test("triggers onItemsChange on drag", () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    const dragHandle = createWrapper().findBoardItem()!.findDragHandle()!;

    dragHandle.keydown(KeyCode.enter);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.down);
    dragHandle.keydown(KeyCode.enter);

    expect(onItemsChange).toBeCalledWith(
      expect.objectContaining({
        detail: {
          movedItem: expect.objectContaining({ id: "1" }),
          items: [
            { id: "2", data: { title: "Item 2" }, columnOffset: { 1: 0 } },
            { id: "1", data: { title: "Item 1" }, columnOffset: { 1: 0 } },
          ],
        },
      }),
    );
  });

  test("triggers onItemsChange on resize", () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    const resizeHandle = createWrapper().findBoardItem()!.findResizeHandle()!;

    resizeHandle.keydown(KeyCode.enter);
    resizeHandle.keydown(KeyCode.down);
    resizeHandle.keydown(KeyCode.down);
    resizeHandle.keydown(KeyCode.enter);

    expect(onItemsChange).toBeCalledWith(
      expect.objectContaining({
        detail: {
          resizedItem: expect.objectContaining({ id: "1" }),
          items: [
            { id: "1", data: { title: "Item 1" }, columnOffset: { 1: 0 }, columnSpan: 1, rowSpan: 4 },
            { id: "2", data: { title: "Item 2" }, columnOffset: { 1: 0 } },
          ],
        },
      }),
    );
  });

  test("triggers onItemsChange on remove", async () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    const removeButton = createWrapper().findBoardItem()!.findSettings()!.find('[data-testid="remove-button"]')!;

    removeButton.click();

    await waitFor(() =>
      expect(onItemsChange).toBeCalledWith(
        expect.objectContaining({
          detail: {
            removedItem: expect.objectContaining({ id: "1" }),
            items: [{ id: "2", data: { title: "Item 2" }, columnOffset: { 1: 0 } }],
          },
        }),
      ),
    );
  });
});
