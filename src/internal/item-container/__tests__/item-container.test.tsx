// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { mockDraggable } from "../../../../lib/components/internal/dnd-controller/__mocks__/controller";
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
  children: <Item />,
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
