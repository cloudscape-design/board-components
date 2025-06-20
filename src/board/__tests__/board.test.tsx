// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { afterEach, beforeAll, beforeEach, describe, expect, test } from "vitest";

import DragHandleWrapper from "@cloudscape-design/components/test-utils/dom/internal/drag-handle";
import { KeyCode } from "@cloudscape-design/test-utils-core/utils";

import Board from "../../../lib/components/board";
import createWrapper from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

import dragHandleStyles from "../../../lib/components/internal/drag-handle/styles.css.js";
import dragHandleTestUtilsStyles from "../../../lib/components/internal/drag-handle/test-classes/styles.css.js";
import globalStateStyles from "../../../lib/components/internal/global-drag-state-styles/styles.css.js";
import resizeHandleStyles from "../../../lib/components/internal/resize-handle/styles.css.js";
import resizeHandleTestUtilsStyles from "../../../lib/components/internal/resize-handle/test-classes/styles.css.js";

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

  test("applies reorder operation classname on pointer interaction", () => {
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

  test("applies resize operation classname on pointer interaction", () => {
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

  describe("sets pointer active states for drag and resize handles", () => {
    let dragHandle: HTMLElement;
    let resizeHandle: HTMLElement;
    let dragHandlePointerActiveClassName: string;
    let dragHandleUapActiveClassName: string;
    let resizeHandlePointerActiveClassName: string;
    let resizeHandleUapActiveClassName: string;

    beforeEach(() => {
      render(<Board {...defaultProps} />);

      dragHandle = createWrapper().findBoardItem()!.findDragHandle()!.getElement();
      resizeHandle = createWrapper().findBoardItem()!.findResizeHandle()!.getElement();
      dragHandlePointerActiveClassName = dragHandleStyles.active;
      dragHandleUapActiveClassName = dragHandleTestUtilsStyles["active-uap"];
      resizeHandlePointerActiveClassName = resizeHandleStyles.active;
      resizeHandleUapActiveClassName = resizeHandleTestUtilsStyles["active-uap"];
    });
    test("drag handle", () => {
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);

      // Pointerdown - activates pointer class
      fireEvent(dragHandle, new MouseEvent("pointerdown", { bubbles: true }));
      expect(dragHandle).toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);

      // Pointerup - removes pointer class - adds UAP active class
      fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
      expect(dragHandle).toHaveClass(dragHandleUapActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);

      // Blur handle - removes UAP active class
      fireEvent.blur(dragHandle);
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);
    });

    test("resize handle", () => {
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);

      // Pointerdown - activates pointer class
      fireEvent(resizeHandle, new MouseEvent("pointerdown", { bubbles: true }));
      expect(resizeHandle).toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);

      // Pointerup - removes pointer class - adds UAP active class
      fireEvent(window, new MouseEvent("pointerup", { bubbles: true }));
      expect(resizeHandle).toHaveClass(resizeHandleUapActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);

      // Blur handle - removes UAP active class
      fireEvent.blur(resizeHandle);
      expect(resizeHandle).not.toHaveClass(resizeHandlePointerActiveClassName);
      expect(resizeHandle).not.toHaveClass(resizeHandleUapActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandlePointerActiveClassName);
      expect(dragHandle).not.toHaveClass(dragHandleUapActiveClassName);
    });
  });

  test("triggers onItemsChange on drag via keyboard", () => {
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

  test("triggers onItemsChange on drag via UAP action button click", () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    const dragHandle = createWrapper().findBoardItem()!.findDragHandle()!;
    const dragHandleEl = dragHandle.getElement();

    fireEvent(dragHandleEl, new MouseEvent("pointerdown", { bubbles: true }));
    fireEvent(dragHandleEl, new MouseEvent("pointerup", { bubbles: true }));
    const dragHandleWrapper = new DragHandleWrapper(document.body);
    const blockEndUapAction = dragHandleWrapper.findVisibleDirectionButtonBlockEnd()!.getElement();
    expect(dragHandleWrapper.findAllVisibleDirectionButtons()).toHaveLength(4);

    fireEvent.click(blockEndUapAction);
    fireEvent.click(blockEndUapAction);
    fireEvent.blur(blockEndUapAction);
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

  test("triggers onItemsChange on resize via keyboard", () => {
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

  test("triggers onItemsChange on resize via UAP action button click", () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} onItemsChange={onItemsChange} />);

    const resizeHandle = createWrapper().findBoardItem()!.findResizeHandle()!;
    const resizeHandleEl = resizeHandle.getElement();

    fireEvent(resizeHandleEl, new MouseEvent("pointerdown", { bubbles: true }));
    fireEvent(resizeHandleEl, new MouseEvent("pointerup", { bubbles: true }));
    const resizeHandleWrapper = new DragHandleWrapper(document.body);
    const blockEndUapAction = resizeHandleWrapper.findVisibleDirectionButtonBlockEnd()!.getElement();
    expect(resizeHandleWrapper.findAllVisibleDirectionButtons()).toHaveLength(4);

    fireEvent.click(blockEndUapAction);
    fireEvent.click(blockEndUapAction);
    fireEvent.blur(blockEndUapAction);
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

  test("removes last item", async () => {
    const onItemsChange = vi.fn();
    render(<Board {...defaultProps} items={[{ id: "1", data: { title: "Item 1" } }]} onItemsChange={onItemsChange} />);

    const removeButton = createWrapper().findBoardItem()!.findSettings()!.find('[data-testid="remove-button"]')!;

    removeButton.click();

    await waitFor(() =>
      expect(onItemsChange).toBeCalledWith(
        expect.objectContaining({
          detail: {
            removedItem: expect.objectContaining({ id: "1" }),
            items: [],
          },
        }),
      ),
    );
  });
});
