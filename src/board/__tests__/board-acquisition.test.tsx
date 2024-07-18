// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { Board } from "../../../lib/components";
import { mockController } from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../lib/components/internal/dnd-controller/controller";
import { Coordinates } from "../../../lib/components/internal/utils/coordinates";
import { defaultProps } from "./utils";

vi.mock("../../../lib/components/internal/dnd-controller/controller");

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
      droppableId: "awsui-placeholder-1-0",
      draggableItem,
      renderAcquiredItem: () => <div data-testid="acquired-item"></div>,
    }),
  );
  expect(screen.queryByTestId("acquired-item")).toBeInTheDOM();

  act(() => mockController.discard());
  expect(screen.queryByTestId("acquired-item")).toBeNull();
});
