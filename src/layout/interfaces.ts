// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { DashboardItem, DataFallbackType } from "../internal/interfaces";

export interface DashboardLayoutProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the dashboard. Each item is includes its position on the dashboard and
   * attached data. The content of an item is controlled by the `renderItem` property.
   */
  items: readonly DashboardLayoutProps.Item<D>[];

  /**
   * Specifies a function to render a dashboard item content. The return value must include dashboard item component.
   */
  renderItem(item: DashboardLayoutProps.Item<D>, actions: DashboardLayoutProps.ItemActions): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings?: DashboardLayoutProps.I18nStrings;

  /**
   * Fired when a user interaction changes size or position of dashboard items.
   */
  onItemsChange: (event: CustomEvent<DashboardLayoutProps.ItemsChangeDetail<D>>) => void;

  /**
   * Rendered when no items provided.
   */
  empty: ReactNode;
}

export namespace DashboardLayoutProps {
  export type Item<D = DataFallbackType> = DashboardItem<D>;

  export interface ItemActions {
    removeItem(): void;
  }

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
    addedItem?: Item<D>;
    removedItem?: Item<D>;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface I18nStrings {
    // TODO: add announcements to dnd interactions
  }
}
