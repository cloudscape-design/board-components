// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { BoardItemProps, BoardProps, ItemsPaletteProps } from "../../lib/components";
import { ItemContextWrapper } from "../board-item/__tests__/board-item-wrapper";

const boardProps: BoardProps = {
  items: [],
  empty: "",
  renderItem: () => <></>,
  onItemsChange: () => {},
  i18nStrings: {
    liveAnnouncementDndCommitted: () => "",
    liveAnnouncementDndDiscarded: () => "",
    liveAnnouncementDndStarted: () => "",
    liveAnnouncementDndItemReordered: () => "",
    liveAnnouncementDndItemResized: () => "",
    liveAnnouncementDndItemInserted: () => "",
    liveAnnouncementItemRemoved: () => "",
    navigationItemAriaLabel: () => "",
    navigationAriaDescription: "",
    navigationAriaLabel: "",
  },
};
const boardItemProps: BoardItemProps = {
  i18nStrings: {
    resizeHandleAriaLabel: "",
    dragHandleAriaLabel: "",
  },
};
const itemsPaletteProps: ItemsPaletteProps = {
  items: [],
  renderItem: () => <></>,
  i18nStrings: {
    liveAnnouncementDndStarted: "",
    liveAnnouncementDndDiscarded: "",
    navigationAriaLabel: "",
    navigationItemAriaLabel: () => "",
  },
};

export const defaultProps = {
  board: boardProps,
  "board-item": boardItemProps,
  "items-palette": itemsPaletteProps,
} as const;

export const wrappers = {
  "board-item": ItemContextWrapper,
};
