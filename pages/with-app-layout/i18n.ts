// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const appLayoutI18nStrings = {
  navigation: "Side navigation",
  navigationToggle: "Open side navigation",
  navigationClose: "Close side navigation",
  notifications: "Notifications",
  tools: "Help panel",
  toolsToggle: "Open help panel",
  toolsClose: "Close help panel",
};

export const splitPanelI18nStrings = {
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
