// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardItemProps, DashboardLayoutProps, DashboardPaletteProps } from "../../lib/components";
import { ItemData } from "./interfaces";

export const dashboardItemI18nStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag handle",
  resizeHandleLabel: "Resize handle",
};

export const paletteI18nStrings: DashboardPaletteProps["i18nStrings"] = {
  liveAnnouncementNoNextItem: "No next item",
  liveAnnouncementNoPreviousItem: "No previous item",
  itemDraggingAriaState: "Dragging",
  itemDragHandleAriaDescription:
    "Use Space or Enter to select item for dragging or to drop it. Use Esc to discard. Use arrow keys to navigate items or drag selected item.",
};

export const dashboardI18nStrings: DashboardLayoutProps.I18nStrings<ItemData> = {
  liveAnnouncementNoItemToTheTop: "No item to the top",
  liveAnnouncementNoItemToTheBottom: "No item to the bottom",
  liveAnnouncementNoItemToTheLeft: "No item to the left",
  liveAnnouncementNoItemToTheRight: "No item to the right",
  liveAnnouncementReachedBottomBoundary: "Reached bottom boundary",
  liveAnnouncementReachedTopBoundary: "Reached top boundary",
  liveAnnouncementReachedLeftBoundary: "Reached left boundary",
  liveAnnouncementReachedRightBoundary: "Reached right boundary",
  liveAnnouncementItemMoved(operation) {
    const conflictsAnnouncement =
      operation.conflicts.length > 0
        ? `Conflicts with ${operation.conflicts.map((c) => c.data.title).join(", ")}.`
        : "";

    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const operationAnnouncement = `Item moved to column ${operation.columnOffset + 1} row ${operation.rowOffset + 1}.`;

    return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
  },
  liveAnnouncementItemInserted(operation) {
    const conflictsAnnouncement =
      operation.conflicts.length > 0
        ? `Conflicts with ${operation.conflicts.map((c) => c.data.title).join(", ")}.`
        : "";

    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const operationAnnouncement = `Item inserted to column ${operation.columnOffset + 1} row ${
      operation.rowOffset + 1
    }.`;

    return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
  },
  liveAnnouncementItemResized(operation) {
    const conflictsAnnouncement =
      operation.conflicts.length > 0
        ? `Conflicts with ${operation.conflicts.map((c) => c.data.title).join(", ")}.`
        : "";

    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const operationAnnouncement = `Item resized to columns ${operation.colspan} rows ${operation.rowspan}.`;

    return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
  },
  liveAnnouncementItemRemoved(operation) {
    const disturbedAnnouncement =
      operation.disturbed.length > 0 ? `Disturbed ${operation.disturbed.length} items.` : "";

    const operationAnnouncement = `Removed item ${operation.item.data.title}.`;

    return [operationAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
  },
  itemDragHandleAriaDescription:
    "Use Space or Enter to select item for dragging or to drop it. Use Esc to discard. Use arrow keys to navigate items or drag selected item.",
  itemResizeHandleAriaDescription:
    "Use Space or Enter to select item for dragging or to drop it. Use Esc to discard. Use arrow keys to navigate items or drag selected item.",
  itemDraggingAriaState: "Dragging",
  itemPositionAriaState(position) {
    const columnsDescription = `columns ${position.columnOffset + 1} - ${position.columnOffset + position.colspan} of ${
      position.columns
    }`;
    const rowsDescription = `rows ${position.rowOffset + 1} - ${position.rowOffset + position.rowspan} of ${
      position.rows
    }`;
    return [columnsDescription, rowsDescription].join(", ");
  },
};
