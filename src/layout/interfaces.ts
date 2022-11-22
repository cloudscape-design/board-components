// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardItem, DashboardItemBase, DataFallbackType } from "../internal/interfaces";

export interface DashboardLayoutProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the dashboard. Each item is includes its position on the dashboard and
   * attached data. The content of an item is controlled by the `renderItem` property.
   */
  items: readonly DashboardLayoutProps.Item<D>[];

  /**
   * Specifies a function to render a dashboard item content. The return value must include dashboard item component.
   */
  renderItem(item: DashboardLayoutProps.Item<D>): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings?: DashboardLayoutProps.I18nStrings;

  /**
   * Fired when a user interaction changes size or position of dashboard items.
   */
  onItemsChange: (event: CustomEvent<DashboardLayoutProps.ItemsChangeDetail<D>>) => void;

  /**
   * Fired when attempting to add a new item to the board.
   * If returns null, the item is not allowed to be added.
   */
  resolveNewItem?: (itemId: string) => null | DashboardItemBase<D>;
}

export namespace DashboardLayoutProps {
  export type Item<D = DataFallbackType> = DashboardItem<D>;

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
    addedItem?: Item<D>;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface I18nStrings {
    // TODO: add announcements to dnd interactions
  }
}
