// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AppLayoutProps } from "@cloudscape-design/components/app-layout";
import { SplitPanelProps } from "@cloudscape-design/components/split-panel";

import { BoardItemProps, BoardProps, ItemsPaletteProps } from "../../lib/components";
import { ItemData } from "./interfaces";

export const appLayoutI18nStrings: AppLayoutProps.Labels = {
  navigation: "Side navigation",
  navigationToggle: "Open side navigation",
  navigationClose: "Close side navigation",
  notifications: "Notifications",
  tools: "Help panel",
  toolsToggle: "Open help panel",
  toolsClose: "Close help panel",
};

export const splitPanelI18nStrings: SplitPanelProps.I18nStrings = {
  preferencesTitle: "Split panel preferences",
  preferencesPositionLabel: "Split panel position",
  preferencesPositionDescription: "Choose the default split panel position for the service.",
  preferencesPositionSide: "Side",
  preferencesPositionBottom: "Bottom",
  preferencesConfirm: "Confirm",
  preferencesCancel: "Cancel",
  closeButtonAriaLabel: "Close panel",
  openButtonAriaLabel: "Open panel",
  resizeHandleAriaLabel: "Resize split panel",
};

export const clientI18nStrings = {
  appLayout: {
    header: "Service Dashboard",
    reloadButton: "Reload",
    addWidgetButton: "Add widget",
    addWidgetsHeader: "Add widgets",
  },
  widgetsBoard: {
    widgetsEmpty: "No widgets",
    widgetsLoading: "Loading board widgets",
    removeWidgetAction: "Remove widget",
    widgetSettings: "Widget settings",
  },
  widgetsPalette: {
    widgetsEmpty: "No widgets",
    widgetsLoading: "Loading palette widgets",
  },
  deleteConfirmation: {
    header: "Delete confirmation",
    confirm: "Yes",
    discard: "No",
    message: (itemTitle: string) => `Remove ${itemTitle}?`,
  },
};

export const boardItemI18nStrings: BoardItemProps.I18nStrings = {
  dragHandleAriaLabel: "Drag handle",
  dragHandleAriaDescription:
    "Use Space or Enter to activate drag, arrow keys to move, Space or Enter to submit, or Escape to discard. Be sure to temporarily disable any screen reader navigation feature that may interfere with the functionality of the arrow keys.",
  resizeHandleAriaLabel: "Resize handle",
  resizeHandleAriaDescription:
    "Use Space or Enter to activate resize, arrow keys to move, Space or Enter to submit, or Escape to discard. Be sure to temporarily disable any screen reader navigation feature that may interfere with the functionality of the arrow keys.",
  dragHandleTooltipText: "Drag or select to move",
  resizeHandleTooltipText: "Drag or select to resize",
};

export const itemsPaletteI18nStrings: ItemsPaletteProps.I18nStrings<ItemData> = {
  liveAnnouncementDndStarted: "Dragging",
  liveAnnouncementDndDiscarded: "Insertion discarded",
  navigationAriaLabel: "Items palette navigation",
  navigationAriaDescription: "Click on an item to move focus over",
  navigationItemAriaLabel: (item) => item.data.title,
};

function createAnnouncement(
  operationAnnouncement: string,
  conflicts: readonly BoardProps.Item<ItemData>[],
  disturbed: readonly BoardProps.Item<ItemData>[],
) {
  const conflictsAnnouncement =
    conflicts.length > 0 ? `Conflicts with ${conflicts.map((c) => c.data.title).join(", ")}.` : "";
  const disturbedAnnouncement = disturbed.length > 0 ? `Disturbed ${disturbed.length} items.` : "";
  return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement].filter(Boolean).join(" ");
}

export const boardI18nStrings: BoardProps.I18nStrings<ItemData> = {
  liveAnnouncementDndStarted(operationType) {
    return operationType === "resize" ? "Resizing" : "Dragging";
  },
  liveAnnouncementDndItemReordered(op) {
    const columns = `column ${op.placement.x + 1}`;
    const rows = `row ${op.placement.y + 1}`;
    return createAnnouncement(
      `Item moved to ${op.direction === "horizontal" ? columns : rows}.`,
      op.conflicts,
      op.disturbed,
    );
  },
  liveAnnouncementDndItemResized(op) {
    const columnsConstraint = op.isMinimalColumnsReached ? " (minimal)" : "";
    const rowsConstraint = op.isMinimalRowsReached ? " (minimal)" : "";
    const sizeAnnouncement =
      op.direction === "horizontal"
        ? `columns ${op.placement.width}${columnsConstraint}`
        : `rows ${op.placement.height}${rowsConstraint}`;
    return createAnnouncement(`Item resized to ${sizeAnnouncement}.`, op.conflicts, op.disturbed);
  },
  liveAnnouncementDndItemInserted(op) {
    const columns = `column ${op.placement.x + 1}`;
    const rows = `row ${op.placement.y + 1}`;
    return createAnnouncement(`Item inserted to ${columns}, ${rows}.`, op.conflicts, op.disturbed);
  },
  liveAnnouncementDndCommitted(operationType) {
    return `${operationType} committed`;
  },
  liveAnnouncementDndDiscarded(operationType) {
    return `${operationType} discarded`;
  },
  liveAnnouncementItemRemoved(op) {
    return createAnnouncement(`Removed item ${op.item.data.title}.`, [], op.disturbed);
  },
  navigationAriaLabel: "Board navigation",
  navigationAriaDescription: "Click on non-empty item to move focus over",
  navigationItemAriaLabel: (item) => (item ? item.data.title : "Empty"),
};
