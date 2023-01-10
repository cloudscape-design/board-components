// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardLayoutProps, DashboardPaletteProps } from "../../lib/components";
import { ItemData } from "./interfaces";

export const paletteI18nStrings: DashboardPaletteProps.I18nStrings<ItemData> = {
  itemDragHandleAriaLabel: (item, index, items) => {
    const itemAnnouncement = "Drag handle, " + item.data.title;
    const positionAnnouncement = index === 0 ? "first item" : index === items.length - 1 ? "last item" : "";
    return [itemAnnouncement, positionAnnouncement].filter(Boolean).join(", ");
  },
  itemDragHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to move, Space key to submit, and Esc key to discard operation.",
  liveAnnouncementDragStarted: "Dragging",
  liveAnnouncementDragDiscarded: "Insertion discarded",
};

export const dashboardI18nStrings: DashboardLayoutProps.I18nStrings<ItemData> = {
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
        const constraintColumns = operation.colspan === 1 ? "(minimal)" : "";
        const columnsAnnouncement = `columns ${operation.colspan} ${constraintColumns}`;

        const constraintRows = operation.rowspan === 2 ? "(minimal)" : "";
        const rowsAnnouncement = `rows ${operation.rowspan} ${constraintRows}`;

        if (operation.direction === "left" || operation.direction === "right") {
          return columnsAnnouncement;
        }
        if (operation.direction === "up" || operation.direction === "down") {
          return rowsAnnouncement;
        }
        return `${columnsAnnouncement}, ${rowsAnnouncement}`;
      }

      const columnsAnnouncement = `column ${operation.columnOffset + 1}`;
      const rowsAnnouncement = `row ${operation.rowOffset + 1}`;

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
  itemDragHandleAriaLabel({ item, columnOffset, colspan, rowOffset, rowspan, columns, rows }) {
    const columnsDescription = `columns ${columnOffset + 1} - ${columnOffset + colspan} of ${columns}`;
    const rowsDescription = `rows ${rowOffset + 1} - ${rowOffset + rowspan} of ${rows}`;
    return ["Drag handle", item.data.title, columnsDescription, rowsDescription].filter(Boolean).join(", ");
  },
  itemDragHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to move, Space key to submit, and Esc key to discard operation.",
  itemResizeHandleAriaLabel: ({ item, columnOffset, colspan, rowOffset, rowspan, columns, rows }) => {
    const columnsDescription = `columns ${columnOffset + 1} - ${columnOffset + colspan} of ${columns}`;
    const rowsDescription = `rows ${rowOffset + 1} - ${rowOffset + rowspan} of ${rows}`;
    return ["Resize handle", item.data.title, columnsDescription, rowsDescription].filter(Boolean).join(", ");
  },
  itemResizeHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to resize, Space key to submit, and Esc key to discard operation.",
};
