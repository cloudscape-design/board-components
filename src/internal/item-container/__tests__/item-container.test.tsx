// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { mockController, mockDraggable } from "../../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../../lib/components/internal/dnd-controller/controller";
import { ItemContainer, ItemContainerProps, useItemContext } from "../../../../lib/components/internal/item-container";
import { Coordinates } from "../../../../lib/components/internal/utils/coordinates";

afterEach(cleanup);

vi.mock("../../../../lib/components/internal/dnd-controller/controller");

const onKeyMoveMock = vi.fn();
const defaultProps: ItemContainerProps = {
  item: {
    id: "ID",
    data: { title: "Title" },
  },
  placed: false,
  acquired: false,
  transform: undefined,
  inTransition: false,
  getItemSize: () => ({ width: 1, minWidth: 1, maxWidth: 1, height: 1, minHeight: 1, maxHeight: 1 }),
  children: () => <Item />,
  isRtl: () => false,
  onKeyMove: onKeyMoveMock,
};

function Item() {
  const context = useItemContext();

  return (
    <div data-testid="content">
      <button
        data-testid="drag-handle"
        onPointerDown={(event) => context.dragHandle.onPointerDown(event as any)}
        onKeyDown={(e) => context.dragHandle.onKeyDown(e)}
      >
        Drag handle
      </button>
      <button
        data-testid="resize-handle"
        onPointerDown={(event) => context.resizeHandle?.onPointerDown(event as any)}
        onKeyDown={(e) => context.resizeHandle?.onKeyDown(e)}
      >
        Resize handle
      </button>
    </div>
  );
}

test("renders item container", () => {
  const { getByTestId } = render(<ItemContainer {...defaultProps} />);
  expect(getByTestId("content")).not.toBe(null);
});

describe("pointer interaction", () => {
  const clickHandle = (selector: HTMLElement, pointerDownOptions?: MouseEventInit) => {
    fireEvent(selector, new MouseEvent("pointerdown", { bubbles: true, button: 0, ...pointerDownOptions }));
    fireEvent(selector, new MouseEvent("pointerup", { bubbles: true }));
  };
  afterEach(vi.resetAllMocks);

  test.each(["drag-handle", "resize-handle"])("ignores right-click on %s", (handleSelector) => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
    clickHandle(getByTestId(handleSelector), { button: 1 });
    expect(mockDraggable.start).not.toHaveBeenCalled();
  });

  test("starts drag transition when drag handle is clicked and item belongs to grid", () => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
    clickHandle(getByTestId("drag-handle"));
    expect(mockDraggable.start).toBeCalledWith("reorder", "pointer", expect.any(Coordinates));
  });

  test("starts insert transition when drag handle is clicked and item does not belong to grid", () => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} />);
    clickHandle(getByTestId("drag-handle"));
    expect(mockDraggable.start).toBeCalledWith("insert", "pointer", expect.any(Coordinates));
  });

  test("starts resize transition when resize handle is clicked", () => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
    clickHandle(getByTestId("resize-handle"));
    expect(mockDraggable.start).toBeCalledWith("resize", "pointer", expect.any(Coordinates));
  });

  test("does not call updateTransition on pointer down and a mouse movement within the CLICK_DRAG_THRESHOLD", () => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} />);
    clickHandle(getByTestId("drag-handle"));
    expect(mockDraggable.updateTransition).not.toBeCalledWith();
  });

  test("call updateTransition on pointer down and a mouse movement outside the CLICK_DRAG_THRESHOLD", () => {
    const { getByTestId } = render(<ItemContainer {...defaultProps} />);
    const dragHandleEl = getByTestId("drag-handle");
    fireEvent(dragHandleEl, new MouseEvent("pointerdown", { clientX: 10, clientY: 20, bubbles: true, button: 0 }));
    fireEvent(dragHandleEl, new MouseEvent("pointermove", { clientX: 15, clientY: 20, bubbles: true }));
    expect(mockDraggable.updateTransition).toBeCalledWith(expect.any(Coordinates));
  });
});

describe("keyboard interaction", () => {
  describe.each(["drag", "resize"])("%s handle", (handle: string) => {
    test(`starts keyboard transition when ${handle} handle receives enter and item belongs to grid`, () => {
      const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
      fireEvent.keyDown(getByTestId(`${handle}-handle`), { key: "Enter" });
      expect(mockDraggable.start).toBeCalledWith("reorder", "keyboard", expect.any(Coordinates));
    });

    test.each([
      { key: "ArrowUp", direction: "up" },
      { key: "ArrowDown", direction: "down" },
      { key: "ArrowLeft", direction: "left" },
      { key: "ArrowRight", direction: "right" },
    ])(`calls onKeyMove($direction) when ${handle} handle receives $key keyDown event`, () => {
      const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
      fireEvent.keyDown(getByTestId(`${handle}-handle`), { key: "ArrowUp" });
      expect(onKeyMoveMock).toBeCalledWith("up");
    });
  });
});

test("does not renders in portal when item in reorder state by a pointer", () => {
  const { container, getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
  expect(container).toContainElement(getByTestId("drag-handle"));
  act(() => {
    mockController.start({
      interactionType: "pointer",
      operation: "reorder",
      draggableItem: defaultProps.item,
      collisionRect: { top: 0, bottom: 0, left: 0, right: 0 },
      coordinates: new Coordinates({ x: 0, y: 0 }),
    } as DragAndDropData);
  });
  expect(container).toContainElement(getByTestId("drag-handle"));
  act(() => {
    mockController.discard();
  });
  expect(container).toContainElement(getByTestId("drag-handle"));
});
