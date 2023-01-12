// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { BoardItemProps, BoardProps, ItemsPaletteProps } from "../../lib/components";
import { ItemData } from "./interfaces";

export const boardItemI18nStrings: BoardItemProps.I18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  dragHandleAriaDescription:
    "Use Space or Enter to activate drag, arrow keys to move, Space or Enter to submit, or Escape to discard.",
  resizeHandleAriaLabel: "Resize handle",
  resizeHandleAriaDescription:
    "Use Space or Enter to activate resize, arrow keys to move, Space or Enter to submit, or Escape to discard.",
};

export const itemsPaletteI18nStrings: ItemsPaletteProps.I18nStrings<ItemData> = {
  liveAnnouncementDragStarted: "Dragging",
  liveAnnouncementDragDiscarded: "Insertion discarded",
  navigationAriaLabel: "Items palette navigation",
  navigationAriaDescription: "Click on an item to move focus over",
  navigationItemAriaLabel: (item) => item.data.title,
};

export const boardI18nStrings: BoardProps.I18nStrings<ItemData> = {
  liveAnnouncementOperationStarted(operationType) {
    return operationType === "resize" ? "Resizing" : "Dragging";
  },
  liveAnnouncementOperation(operationType, operation) {
    const conflicts = operation.conflicts.map((c) => c.data.title).join(", ");
    const conflictsAnnouncement = operation.conflicts.length > 0 ? `Conflicts with ${conflicts}.` : "";

    const totalDisturbed = operation.disturbed.length;
    const disturbedAnnouncement = totalDisturbed > 0 ? `Disturbed ${totalDisturbed} items.` : "";

    const isHorizontal = operation.direction === "horizontal";
    const currentColumn = `column ${operation.placement?.x || 0 + 1}`;
    const currentRow = `row ${operation.placement?.y || 0 + 1}`;

    const resizeAnnouncement = () => {
      if (isHorizontal) {
        const minColumns = operation.item.definition.minColumnSpan ?? 1;
        const constraintColumns = operation.placement!.width === minColumns ? "(minimal)" : "";
        return `columns ${operation.placement!.width} ${constraintColumns}`;
      } else {
        const minRows = operation.item.definition.minRowSpan ?? 2;
        const constraintRows = operation.placement!.height === minRows ? "(minimal)" : "";
        return `rows ${operation.placement!.height} ${constraintRows}`;
      }
    };

    const operationAnnouncement = () => {
      switch (operationType) {
        case "reorder":
          return `Item moved to ${isHorizontal ? currentColumn : currentRow}.`;
        case "insert":
          return `Item inserted to ${currentColumn}, ${currentRow}.`;
        case "resize":
          return `Item resized to ${resizeAnnouncement()}.`;
        case "remove":
          return `Removed item ${operation.item.data.title}.`;
      }
    };

    return [operationAnnouncement(), conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
  },
  liveAnnouncementOperationCommitted(operationType) {
    return `${operationType} committed`;
  },
  liveAnnouncementOperationDiscarded(operationType) {
    return `${operationType} discarded`;
  },
  navigationAriaLabel: "Board navigation",
  navigationAriaDescription: "Click on non-empty item to move focus over",
  navigationItemAriaLabel: (item) => (item ? item.data.title : "Empty"),
};
