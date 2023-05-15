// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyCode } from "@cloudscape-design/test-utils-core/utils";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import Board, { BoardProps } from "../../../lib/components/board";
import boardStyles from "../../../lib/components/board/styles.css.js";
import BoardItem from "../../../lib/components/board-item";
import { mockController } from "../../../lib/components/internal/dnd-controller/__mocks__/controller";
import { DragAndDropData } from "../../../lib/components/internal/dnd-controller/controller";
import { Coordinates } from "../../../lib/components/internal/utils/coordinates";
import createWrapper from "../../../lib/components/test-utils/dom";

afterEach(cleanup);

vi.mock("../../../lib/components/internal/dnd-controller/controller");

const operationData: DragAndDropData = {
  draggableItem: { id: "2", data: {} },
  dropTarget: { scale: vi.fn() },
  operation: "reorder",
  interactionType: "keyboard",
  collisionRect: { top: 0, left: 0, right: 0, bottom: 0 },
  positionOffset: new Coordinates({ x: 0, y: 0 }),
  coordinates: new Coordinates({ x: 0, y: 0 }),
  collisionIds: [],
};

interface ItemData {
  title: string;
}

const i18nStrings: BoardProps.I18nStrings<ItemData> = {
  liveAnnouncementDndStarted() {
    return "Operation started";
  },
  liveAnnouncementDndItemReordered() {
    return "Reorder performed";
  },
  liveAnnouncementDndItemResized() {
    return "Resize performed";
  },
  liveAnnouncementDndItemInserted() {
    return "Insert performed";
  },
  liveAnnouncementDndCommitted() {
    return "Operation committed";
  },
  liveAnnouncementDndDiscarded() {
    return "Operation discarded";
  },
  liveAnnouncementItemRemoved() {
    return "Remove performed";
  },
  navigationAriaLabel: "Board navigation",
  navigationAriaDescription: "Click on non-empty item to move focus over",
  navigationItemAriaLabel: (item) => (item ? item.data.title : "Empty"),
};

const itemI18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  resizeHandleAriaLabel: "Resize handle",
};

describe("Board", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders empty board", () => {
    render(
      <Board
        items={[]}
        renderItem={() => <>{null}</>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );
    const wrapper = createWrapper().findBoard()!;

    expect(wrapper.getElement().textContent).toBe("No items");
  });

  test("renders board with items", () => {
    render(
      <Board
        items={[
          { id: "1", data: { title: "Item 1" } },
          { id: "2", data: { title: "Item 2" } },
        ]}
        renderItem={(item) => <div>{item.data.title}</div>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );
    const item = createWrapper().findBoard()!.findItemById("2")!;

    expect(item.getElement().textContent).toBe("Item 2");
  });

  test("pressing 'Escape' when there is no transition does not cause errors", () => {
    render(
      <Board
        items={[
          { id: "1", data: { title: "Item 1" } },
          { id: "2", data: { title: "Item 2" } },
        ]}
        renderItem={(item) => <BoardItem i18nStrings={itemI18nStrings}>{item.data.title}</BoardItem>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );
    const itemDragHandle = createWrapper().findBoard()!.findItemById("2")!.findDragHandle();

    itemDragHandle.focus();
    itemDragHandle.keydown(KeyCode.escape);
  });

  test("applies reorder operation classname", () => {
    render(
      <Board
        items={[
          { id: "1", data: { title: "Item 1" } },
          { id: "2", data: { title: "Item 2" } },
        ]}
        renderItem={(item) => <BoardItem i18nStrings={itemI18nStrings}>{item.data.title}</BoardItem>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );

    const reorderClass = boardStyles["current-operation-reorder"];

    expect(createWrapper().findByClassName(reorderClass)).toBeNull();

    // Start a reorder operation and check that the class is set
    act(() => mockController.start(operationData));
    expect(createWrapper().findByClassName(reorderClass)?.getElement()).toBeInTheDocument();

    // Discard operation and check that the class is not set
    act(() => mockController.discard());
    expect(createWrapper().findByClassName(reorderClass)).toBeNull();
  });

  test("applies resize operation classname", () => {
    render(
      <Board
        items={[
          { id: "1", data: { title: "Item 1" } },
          { id: "2", data: { title: "Item 2" } },
        ]}
        renderItem={(item) => <BoardItem i18nStrings={itemI18nStrings}>{item.data.title}</BoardItem>}
        onItemsChange={() => undefined}
        i18nStrings={i18nStrings}
        empty="No items"
      />
    );

    const resizeClass = boardStyles["current-operation-resize"];

    expect(createWrapper().findByClassName(resizeClass)).toBeNull();

    // Start a resize operation and check that the class is set
    act(() => mockController.start({ ...operationData, operation: "resize" }));
    expect(createWrapper().findByClassName(resizeClass)?.getElement()).toBeInTheDocument();

    // Discard operation and check that the class is not set
    act(() => mockController.discard());
    expect(createWrapper().findByClassName(resizeClass)).toBeNull();
  });
});
