// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BoardItemDefinitionBase, DataFallbackType } from "../internal/interfaces";

export interface ItemsPaletteProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the palette. The content of each item is controlled by the `renderItem` property.
   */
  items: ReadonlyArray<ItemsPaletteProps.Item<D>>;

  /**
   * Specifies a function to render a palette item content. The return value must include board item component.
   */
  renderItem: (item: ItemsPaletteProps.Item<D>, context: ItemsPaletteProps.ItemContext) => JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: ItemsPaletteProps.I18nStrings<D>;
}

export namespace ItemsPaletteProps {
  export type Item<D = DataFallbackType> = BoardItemDefinitionBase<D>;

  export interface ItemContext {
    showPreview: boolean;
  }

  export interface I18nStrings<D> {
    /**
     * Specifies live announcement made when drag starts.
     *
     * Example: "Dragging".
     */
    liveAnnouncementDragStarted: string;
    /**
     * Specifies live announcement made when palette item is dropped back to palette.
     *
     * Example: "Insertion discarded".
     */
    liveAnnouncementDragDiscarded: string;
    /**
     * Specifies ARIA-label for screen-reader items palette navigation.
     *
     * Example: "Board navigation".
     */
    navigationAriaLabel: string;
    /**
     * Specifies ARIA-description for screen-reader items palette navigation.
     *
     * Example: "Click on an item to move focus over."
     */
    navigationAriaDescription?: string;
    /**
     * Specifies ARIA-label for navigated palette item.
     *
     * Example: "Widget 1".
     */
    navigationItemAriaLabel: (item: ItemsPaletteProps.Item<D>) => string;
  }
}
