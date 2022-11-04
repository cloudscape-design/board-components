// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { HTMLAttributes, Ref } from "react";
import { DataFallbackType, ItemBase } from "../internal/base-types";

// TODO: remove this context argument and integrate this info into DashboardItem
export interface ItemContext {
  ref: Ref<any>;
  props: HTMLAttributes<HTMLElement>;
  isDragging: boolean;
}

export interface DashboardLayoutProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the dashboard. Each item is includes its position on the dashboard and
   * attached data. The content of an item is controlled by the `renderItem` property.
   */
  items: readonly DashboardLayoutProps.Item<D>[];

  /**
   * Specifies a function to render a dashboard item content. The return value must include dashboard item component.
   */
  renderItem(item: DashboardLayoutProps.Item<D>, context: ItemContext): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings?: DashboardLayoutProps.I18nStrings;

  /**
   * Fired when a user interaction changes size or position of dashboard items.
   */
  onItemsChange: (event: CustomEvent<DashboardLayoutProps.ItemsChangeDetail<D>>) => void;
}

export namespace DashboardLayoutProps {
  export interface Item<D = DataFallbackType> extends ItemBase<D> {
    columnOffset: number;
    rowSpan: number;
    columnSpan: number;
  }

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface I18nStrings {
    // TODO: add announcements to dnd interactions
  }
}
