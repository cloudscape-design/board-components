// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DashboardItemBase, DataFallbackType } from "../internal/interfaces";

export interface DashboardPaletteProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the palette. The content of each item is controlled by the `renderItem` property.
   */
  items: readonly DashboardPaletteProps.Item<D>[];

  /**
   * Specifies a function to render a palette item content. The return value must include dashboard item component.
   */
  renderItem(item: DashboardPaletteProps.Item<D>, context: DashboardPaletteProps.ItemContext): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: DashboardPaletteProps.I18nStrings<D>;
}

export namespace DashboardPaletteProps {
  export type Item<D = DataFallbackType> = DashboardItemBase<D>;

  export interface ItemContext {
    showPreview: boolean;
  }

  export interface I18nStrings<D> {
    /**
     * Specifies live announcement made when user reaches the first item and tries to navigate further back.
     *
     * Example: "No previous item".
     */
    liveAnnouncementNoPreviousItem: string;
    /**
     * Specifies live announcement made when user reaches the last item and tries to navigate further forward.
     *
     * Example: "No next item".
     */
    liveAnnouncementNoNextItem: string;
    /**
     * Specifies live announcement made when palette item is dropped back to palette.
     *
     * Example: "Insertion discarded".
     */
    liveAnnouncementDragDiscarded: string;
    /**
     * Specifies palette item's drag handle aria label.
     *
     * Example: "Drag handle, Demo widget" or "Dragging Demo widget"
     */
    itemDragHandleAriaLabel: (isDragging: boolean, item: Item<D>) => string;
    /**
     * Specifies palette item's drag handle aria description.
     *
     * Example: "Use drag handle to ...".
     */
    itemDragHandleAriaDescription: string;
  }
}
