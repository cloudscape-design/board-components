// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardLayoutProps, DashboardPaletteProps } from "../../lib/components";
import { ItemData } from "./interfaces";

export const paletteI18nStrings: DashboardPaletteProps.I18nStrings<ItemData> = {
  liveAnnouncementNoNextItem: "No next item",
  liveAnnouncementNoPreviousItem: "No previous item",
  itemDragHandleAriaLabel: (isDragging, item) => (isDragging ? "Dragging " : "Drag handle ") + item.data.title,
  itemDragHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to move, Space key to submit, and Esc key to discard operation.",
  liveAnnouncementDragDiscarded: "insert discarded",
};

export const dashboardI18nStrings: DashboardLayoutProps.I18nStrings<ItemData> = {
  liveAnnouncementNoItem: (edge) => `No item to the ${edge}`,
  liveAnnouncementReachedEdge(operationType, edge) {
    if (operationType === "resize" && edge === "top") {
      return "Reached minimal height";
    }
    if (operationType === "resize" && edge === "left") {
      return "Reached minimal width";
    }
    return `Reached ${edge} edge`;
  },
  liveAnnouncementOperation(operationType, operation) {
    const conflictsAnnouncement =
      operation.conflicts.length > 0
        ? `Conflicts with ${operation.conflicts.map((c) => c.data.title).join(", ")}.`
        : "";

    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const operationAnnouncement = (() => {
      switch (operationType) {
        case "reorder":
          return `Item moved to column ${operation.columnOffset + 1} row ${operation.rowOffset + 1}.`;
        case "insert":
          return `Item inserted to column ${operation.columnOffset + 1} row ${operation.rowOffset + 1}.`;
        case "resize":
          return `Item resized to columns ${operation.colspan} rows ${operation.rowspan}.`;
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
  itemDragHandleAriaLabel(isDragging, { item, columnOffset, colspan, rowOffset, rowspan, columns, rows }) {
    const stateDescription = isDragging ? "Dragging" : "Drag handle";
    const columnsDescription = `columns ${columnOffset + 1} - ${columnOffset + colspan} of ${columns}`;
    const rowsDescription = `rows ${rowOffset + 1} - ${rowOffset + rowspan} of ${rows}`;
    return [stateDescription, item.data.title, columnsDescription, rowsDescription].filter(Boolean).join(", ");
  },
  itemDragHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to move, Space key to submit, and Esc key to discard operation.",
  itemResizeHandleAriaLabel: (isDragging, { item, columnOffset, colspan, rowOffset, rowspan, columns, rows }) => {
    const stateDescription = isDragging ? "Resizing" : "Resize handle";
    const columnsDescription = `columns ${columnOffset + 1} - ${columnOffset + colspan} of ${columns}`;
    const rowsDescription = `rows ${rowOffset + 1} - ${rowOffset + rowspan} of ${rows}`;
    return [stateDescription, item.data.title, columnsDescription, rowsDescription].filter(Boolean).join(", ");
  },
  itemResizeHandleAriaDescription:
    "When not dragging, use arrow keys for navigation and Space key to activate drag. When dragging, use arrow keys to resize, Space key to submit, and Esc key to discard operation.",
};
