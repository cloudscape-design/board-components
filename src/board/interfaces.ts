// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { BoardItemDefinition, DataFallbackType, Direction } from "../internal/interfaces";

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
    liveAnnouncementOperation: (operationType: OperationType, operation: OperationState<D>) => string;
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
     * Specifies layout item's drag handle aria label.
     *
     * Example: "Drag handle, Demo widget, columns 2-4 of 4, rows 1-2 or 12".
     */
    itemDragHandleAriaLabel: (placement: PositionState<D>) => string;
    /**
     * Specifies layout item's drag handle aria description.
     *
     * Example: "Use drag handle to ..."
     */
    itemDragHandleAriaDescription: string;
    /**
     * Specifies layout item's resize handle aria label.
     *
     * Example: "Resize handle, Demo widget, columns 2-4 of 4, rows 1-2 or 12".
     */
    itemResizeHandleAriaLabel: (placement: PositionState<D>) => string;
    /**
     * Specifies layout item's resize handle aria description.
     *
     * Example: "Use resize handle to ..."
     */
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
    direction: null | Direction;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
}
