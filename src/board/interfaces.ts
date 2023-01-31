// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import {
  BoardItemDefinition,
  BoardItemDefinitionBase,
  DataFallbackType,
  Direction,
  GridLayout,
  GridLayoutItem,
  ItemId,
} from "../internal/interfaces";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import { NonCancelableEventHandler } from "../internal/utils/events";
import { Position } from "../internal/utils/position";

/*
  Note:
  The component does not provide handling of items state (loading, error, loaded).
  It is the responsibility of the client to control it and provide the necessary
  ARIA-live announcements.
*/

export interface BoardProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the board. Each item is includes its position on the board and
   * attached data. The content of an item is controlled by the `renderItem` property.
   */
  items: ReadonlyArray<BoardProps.Item<D>>;

  /**
   * Specifies a function to render a board item content. The return value must include board item component.
   */
  renderItem: (item: BoardProps.Item<D>, actions: BoardProps.ItemActions) => JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   */
  i18nStrings: BoardProps.I18nStrings<D>;

  /**
   * Fired when a user interaction changes size or position of board items.
   */
  onItemsChange: NonCancelableEventHandler<BoardProps.ItemsChangeDetail<D>>;

  /**
   * Rendered when the `items` array is empty.
   *
   * When items are loading the slot can be used to render the loading indicator.
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
     * Specifies live announcement made when reorder operation is performed.
     *
     * Example: "Moved Demo widget to column 2, row 3. Conflicts with Second widget. Disturbed 2 items."
     */
    liveAnnouncementOperationReorder: (operation: OperationStateReorder<D>) => string;
    /**
     * Specifies live announcement made when resize operation is performed.
     *
     * Example: "Resized Demo widget to 3 columns. Disturbed 2 items."
     */
    liveAnnouncementOperationResize: (operation: OperationStateResize<D>) => string;
    /**
     * Specifies live announcement made when insert operation is performed.
     *
     * Example: "Inserted Demo widget to column 1 row 1. Disturbed 2 items."
     */
    liveAnnouncementOperationInsert: (operation: OperationStateInsert<D>) => string;
    /**
     * Specifies live announcement made when remove operation is performed.
     *
     * Example: "Removed Demo widget. Disturbed 2 items."
     */
    liveAnnouncementOperationRemove: (operation: OperationStateRemove<D>) => string;
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

  export interface OperationStateReorder<D> {
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateInsert<D> {
    item: Item<D>;
    placement: ItemPlacement;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateResize<D> {
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    isMinimalColumnsReached: boolean;
    isMinimalRowsReached: boolean;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }
  export interface OperationStateRemove<D> {
    item: Item<D>;
    disturbed: readonly Item<D>[];
  }
}

export interface Transition<D> {
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  insertionDirection: null | Direction;
  draggableItem: BoardItemDefinitionBase<D>;
  draggableElement: HTMLElement;
  acquiredItem: null | BoardItemDefinition<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  path: readonly Position[];
}

export interface RemoveTransition<D> {
  items: readonly BoardProps.Item<D>[];
  removedItem: BoardItemDefinitionBase<D>;
  layoutShift: LayoutShift;
}

export type TransitionAnnouncement =
  | OperationStartedAnnouncement
  | OperationPerformedAnnouncement
  | OperationCommittedAnnouncement
  | OperationDiscardedAnnouncement
  | ItemRemovedAnnouncement;

export interface OperationStartedAnnouncement {
  type: "operation-started";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface OperationPerformedAnnouncement {
  type: "operation-performed";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
  placement: Omit<GridLayoutItem, "id">;
  direction: null | Direction;
  conflicts: Set<ItemId>;
  disturbed: Set<ItemId>;
}
export interface OperationCommittedAnnouncement {
  type: "operation-committed";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface OperationDiscardedAnnouncement {
  type: "operation-discarded";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface ItemRemovedAnnouncement {
  type: "item-removed";
  item: BoardItemDefinitionBase<unknown>;
  disturbed: Set<ItemId>;
}
