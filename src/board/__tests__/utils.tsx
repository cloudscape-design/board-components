// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Button from "@cloudscape-design/components/button";

import { BoardProps } from "../../../lib/components/board";
import BoardItem from "../../../lib/components/board-item";

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

export const defaultProps: BoardProps<{ title: string }> = {
  items: [
    { id: "1", data: { title: "Item 1" } },
    { id: "2", data: { title: "Item 2" } },
  ],
  renderItem: (item, actions) => (
    <BoardItem
      i18nStrings={itemI18nStrings}
      settings={
        <Button data-testid="remove-button" onClick={() => actions.removeItem()}>
          Remove
        </Button>
      }
    >
      {item.data.title}
    </BoardItem>
  ),
  onItemsChange: () => undefined,
  i18nStrings: i18nStrings,
  empty: "No items",
};
