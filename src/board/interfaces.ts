// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { BoardItemDefinition, DataFallbackType } from "../internal/interfaces";

export interface BoardProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the board. Each item is includes its position on the board and
   * attached data. The content of an item is controlled by the `renderItem` property.
   */
  items: readonly BoardProps.Item<D>[];

  /**
   * Specifies a function to render a board item content. The return value must include board item component.
   */
  renderItem(item: BoardProps.Item<D>, actions: BoardProps.ItemActions): JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: BoardProps.I18nStrings<D>;

  /**
   * Fired when a user interaction changes size or position of board items.
   */
  onItemsChange: (event: CustomEvent<BoardProps.ItemsChangeDetail<D>>) => void;

  /**
   * Rendered when no items provided.
   */
  empty: ReactNode;
}

export namespace BoardProps {
  export type Item<D = DataFallbackType> = BoardItemDefinition<D>;

  export interface ItemActions {
    removeItem(): void;
  }

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
    addedItem?: Item<D>;
    removedItem?: Item<D>;
  }

  export interface I18nStrings<D> {
    /**
     * Specifies live announcement made when operation starts.
     *
     * Example: "Dragging".
     */
    liveAnnouncementOperationStarted: (operationType: OperationType) => string;
    /**
     * Specifies live announcement made when operation is performed.
     *
     * Example: "Moved Demo widget to column 2, row 3. Conflicts with Second widget. Disturbed 2 items."
     */
    liveAnnouncementOperation: (operation: OperationState<D>) => string;
    /**
     * Specifies live announcement made when operation is committed.
     *
     * Example: "Reorder committed".
     */
    liveAnnouncementOperationCommitted: (operationType: DragOperationType) => string;
    /**
     * Specifies live announcement made when operation is discarded.
     *
     * Example: "Reorder discarded".
     */
    liveAnnouncementOperationDiscarded: (operationType: DragOperationType) => string;
    /**
     * Specifies ARIA-label for screen-reader board navigation.
     *
     * Example: "Board navigation".
     */
    navigationAriaLabel: string;
    /**
     * Specifies ARIA-description for screen-reader board navigation.
     *
     * Example: "Click on non-empty item to move focus over."
     */
    navigationAriaDescription?: string;
    /**
     * Specifies ARIA-label for navigated grid item. Includes empty cells.
     *
     * Example: "Widget 1" or "Empty".
     */
    navigationItemAriaLabel: (item: null | BoardProps.Item<D>) => string;
  }

  export type DragOperationType = "reorder" | "resize" | "insert";

  export type OperationType = "reorder" | "resize" | "insert" | "remove";

  export type Edge = "left" | "right" | "top" | "bottom";

  export interface ItemPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export type OperationState<D> =
    | OperationStateReorder<D>
    | OperationStateInsert<D>
    | OperationStateResize<D>
    | OperationStateRemove<D>;

  export interface OperationStateReorder<D> {
    operationType: "reorder";
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateInsert<D> {
    operationType: "insert";
    item: Item<D>;
    placement: ItemPlacement;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateResize<D> {
    operationType: "resize";
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    isMinimalColumnsReached: boolean;
    isMinimalRowsReached: boolean;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateRemove<D> {
    operationType: "remove";
    item: Item<D>;
    disturbed: readonly Item<D>[];
  }
}
