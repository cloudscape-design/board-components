// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { Board, BoardProps } from "../../../lib/components";
import { mockController, mockDroppables } from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../lib/components/internal/dnd-controller/controller";
import { Coordinates } from "../../../lib/components/internal/utils/coordinates";
import createWrapper from "../../../lib/components/test-utils/dom";
import { defaultProps } from "./utils";

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
