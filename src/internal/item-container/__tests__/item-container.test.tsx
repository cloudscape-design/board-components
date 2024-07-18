// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

import { mockController, mockDraggable } from "../../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../../lib/components/internal/dnd-controller/controller";
import { ItemContainer, ItemContainerProps, useItemContext } from "../../../../lib/components/internal/item-container";
import { Coordinates } from "../../../../lib/components/internal/utils/coordinates";

afterEach(cleanup);

vi.mock("../../../../lib/components/internal/dnd-controller/controller");

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
};

function Item() {
  const context = useItemContext();

  return (
    <div data-testid="content">
      <button data-testid="drag-handle" onClick={(event) => context.dragHandle.onPointerDown(event as any)}>
        Drag handle
      </button>
      <button data-testid="resize-handle" onClick={(event) => context.resizeHandle?.onPointerDown(event as any)}>
        Resize handle
      </button>
    </div>
  );
}

test("renders item container", () => {
  const { getByTestId } = render(<ItemContainer {...defaultProps} />);
  expect(getByTestId("content")).not.toBe(null);
});

test("starts drag transition when drag handle is clicked and item belongs to grid", () => {
  const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
  getByTestId("drag-handle").click();
  expect(mockDraggable.start).toBeCalledWith("reorder", "pointer", expect.any(Coordinates));
});

test("starts insert transition when drag handle is clicked and item does not belong to grid", () => {
  const { getByTestId } = render(<ItemContainer {...defaultProps} />);
  getByTestId("drag-handle").click();
  expect(mockDraggable.start).toBeCalledWith("insert", "pointer", expect.any(Coordinates));
});

test("starts resize transition when resize handle is clicked", () => {
  const { getByTestId } = render(<ItemContainer {...defaultProps} placed={true} />);
  getByTestId("resize-handle").click();
  expect(mockDraggable.start).toBeCalledWith("resize", "pointer", expect.any(Coordinates));
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
