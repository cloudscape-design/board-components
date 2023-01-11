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
    const conflictsAnnouncement =
      operation.conflicts.length > 0
        ? `Conflicts with ${operation.conflicts.map((c) => c.data.title).join(", ")}.`
        : "";

    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const positionAnnouncement = (() => {
      if (operationType === "resize") {
        const constraintColumns = operation.placement!.width === 1 ? "(minimal)" : "";
        const columnsAnnouncement = `columns ${operation.placement!.width} ${constraintColumns}`;

        const constraintRows = operation.placement!.height === 2 ? "(minimal)" : "";
        const rowsAnnouncement = `rows ${operation.placement!.height} ${constraintRows}`;

        if (operation.direction === "left" || operation.direction === "right") {
          return columnsAnnouncement;
        }
        if (operation.direction === "up" || operation.direction === "down") {
          return rowsAnnouncement;
        }
        return `${columnsAnnouncement}, ${rowsAnnouncement}`;
      }

      const columnsAnnouncement = `column ${operation.placement!.x + 1}`;
      const rowsAnnouncement = `row ${operation.placement!.y + 1}`;

      if (operationType === "reorder" && (operation.direction === "left" || operation.direction === "right")) {
        return columnsAnnouncement;
      }
      if (operationType === "reorder" && (operation.direction === "up" || operation.direction === "down")) {
        return rowsAnnouncement;
      }
      return `${columnsAnnouncement}, ${rowsAnnouncement}`;
    })();

    const operationAnnouncement = (() => {
      switch (operationType) {
        case "reorder":
          return `Item moved to ${positionAnnouncement}.`;
        case "insert":
          return `Item inserted to ${positionAnnouncement}.`;
        case "resize":
          return `Item resized to ${positionAnnouncement}.`;
        case "remove":
          return `Removed item ${operation.item.data.title}.`;
      }
    })();

    return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
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
