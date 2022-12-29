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
  i18nStrings: DashboardLayoutProps.I18nStrings<D>;

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

  export interface I18nStrings<D> {
    liveAnnouncementNoItem: (edge: Edge) => string;
    liveAnnouncementReachedEdge: (operationType: DragOperationType, edge: Edge) => string;
    liveAnnouncementOperation: (operationType: OperationType, operation: OperationState<D>) => string;
    liveAnnouncementOperationCommitted: (operationType: DragOperationType) => string;
    liveAnnouncementOperationDiscarded: (operationType: DragOperationType) => string;
    itemDragHandleAriaLabel: (isDragging: boolean, placement: PositionState<D>) => string;
    itemDragHandleAriaDescription: string;
    itemResizeHandleAriaLabel: (isDragging: boolean, placement: PositionState<D>) => string;
    itemResizeHandleAriaDescription: string;
  }

  export type DragOperationType = "reorder" | "resize" | "insert";

  export type OperationType = "reorder" | "resize" | "insert" | "remove";

  export type Edge = "left" | "right" | "top" | "bottom";

  export interface PositionState<D> {
    item: Item<D>;
    colspan: number;
    rowspan: number;
    columnOffset: number;
    rowOffset: number;
    columns: number;
    rows: number;
  }

  export interface OperationState<D> extends PositionState<D> {
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
}
