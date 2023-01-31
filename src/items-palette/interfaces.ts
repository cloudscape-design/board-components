// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BoardItemDefinitionBase, DataFallbackType } from "../internal/interfaces";

/*
  Note:
  The component does not provide handling of items state (loading, error, loaded).
  It is the responsibility of the client to control it and provide the necessary
  ARIA-live announcements.
*/

export interface ItemsPaletteProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the palette. The content of each item is controlled by the `renderItem` property.
   *
   * The ItemsPaletteProps.Item includes:
   * * `id` (string) - the unique item identifier. The IDs of any two items in a page must be different.
   * * `definition.minRowSpan` (number, optional) - the minimal number of rows the item is allowed to take. It can't be less than 2. Defaults to 2.
   * * `definition.minColumnSpan` (number, optional) - the minimal number of columns the item is allowed to take (in 4-column layout). It can't be less than 1. Defaults to 1.
   * * `definition.defaultRowSpan` (number) - the number or rows the item will take when inserted to the board. It can't be less than `definition.minRowSpan`.
   * * `definition.defaultColumnSpan` (number) - the number or columns the item will take (in 4-column layout) when inserted to the board. It can't be less than `definition.minColumnSpan`.
   * * `data` (D) - the optional item's data which can include item's specific configuration, title etc.
   */
  items: ReadonlyArray<ItemsPaletteProps.Item<D>>;

  /**
   * Specifies a function to render a palette item content. The return value must include board item component.
   *
   * The function takes the item and its associated context (ItemsPaletteProps.ItemContext) that include:
   * * `showPreview` (boolean) - a flag that indicates if the item's content needs to be rendered in the preview mode.
   */
  renderItem: (item: ItemsPaletteProps.Item<D>, context: ItemsPaletteProps.ItemContext) => JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   *
   * Live announcements:
   * * `liveAnnouncementDndStarted` (string) - the live announcement string for the drag start.
   * * `liveAnnouncementDndDiscarded` (string) - the live announcement string for the drag discard.
   *
   * Navigation labels:
   * * `navigationAriaLabel` (string) - the ARIA label for the accessible board navigation element.
   * * `navigationAriaDescription` (string, optional) - the ARIA description for the accessible board navigation element.
   * * `navigationItemAriaLabel(null | BoardProps.Item<D>): string` - the function to create the ARIA label for a navigation board item.
   */
  i18nStrings: ItemsPaletteProps.I18nStrings<D>;
}

export namespace ItemsPaletteProps {
  export type Item<D = DataFallbackType> = BoardItemDefinitionBase<D>;

  export interface ItemContext {
    showPreview: boolean;
  }

  export interface I18nStrings<D> {
    liveAnnouncementDndStarted: string;
    liveAnnouncementDndDiscarded: string;
    navigationAriaLabel: string;
    navigationAriaDescription?: string;
    navigationItemAriaLabel: (item: ItemsPaletteProps.Item<D>) => string;
  }
}
