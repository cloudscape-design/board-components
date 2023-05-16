// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { KeyCode } from "@cloudscape-design/test-utils-core/utils";
import { cleanup, render } from "@testing-library/react";
import userEvent, { PointerEventsCheckLevel } from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, test } from "vitest";
import Board, { BoardProps } from "../../../lib/components/board";
import boardStyles from "../../../lib/components/board/styles.css.js";
import BoardItem from "../../../lib/components/board-item";
import createWrapper from "../../../lib/components/test-utils/dom";

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
  beforeAll(() => {
    // jsdom does not support this function
    document.elementFromPoint = () => null;
  });

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

  test("applies reorder operation classname", async () => {
    const { container } = render(
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
    expect(container.ownerDocument.body).not.toHaveClass(reorderClass);

    const handle = createWrapper().findBoardItem()!.findDragHandle()!.getElement();
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

    // Start a reorder operation and check that the class is set
    await user.pointer({ keys: "[MouseLeft>]", target: handle });
    expect(container.ownerDocument.body).toHaveClass(reorderClass);

    // Release pointer and check that the class is not set
    await user.pointer({ keys: "[/MouseLeft]" });
    expect(container.ownerDocument.body).not.toHaveClass(reorderClass);
  });

  test("applies resize operation classname", async () => {
    const { container } = render(
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
    expect(container.ownerDocument.body).not.toHaveClass(resizeClass);

    const handle = createWrapper().findBoardItem()!.findResizeHandle()!.getElement();
    const user = userEvent.setup({ pointerEventsCheck: PointerEventsCheckLevel.Never });

    // Start a resize operation and check that the class is set
    await user.pointer({ keys: "[MouseLeft>]", target: handle });
    expect(container.ownerDocument.body).toHaveClass(resizeClass);

    // Release pointer and check that the class is not set
    await user.pointer({ keys: "[/MouseLeft]" });
    expect(container.ownerDocument.body).not.toHaveClass(resizeClass);
  });
});
