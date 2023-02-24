// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";
import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import {
  BoardData,
  BoardItem,
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
   * Specifies the items displayed in the board and items layouts for supported board widths.
   *
   * The board data includes:
   * * `items` (array) - the array of item definitions.
   * * `layout` (mapping) - item positions for all board widths.
   *
   * The board data item includes:
   * * `id` (string) - the unique item identifier. The IDs of any two items in a page must be different.
   * * `minRowSpan` (number, optional) - the minimal number of rows the item is allowed to take. It can't be less than two. Defaults to two.
   * * `minColumnSpan` (mapping, optional) - the minimal number of columns the item is allowed to take per layout. It can't be less than one. Defaults to one.
   * * `defaultRowSpan` (number, optional) - the number or rows the item will take when inserted to the board. It can't be less than `minRowSpan`.
   * * `defaultColumnSpan` (mapping, optional) - the number or columns the item will take when inserted in the board per layout. It can't be less than `minColumnSpan`.
   * * `data` (D) - optional item data which can include the specific configurations of an item, such as its title.
   */
  data: BoardProps.Data<D>;

  /**
   * Specifies a function to render content for board items. The return value must include board item component.
   *
   * The function takes the item and its associated actions (BoardProps.ItemActions) that include:
   * * `removeItem(): void` - the callback to issue the item's removal. Once issued, the `onItemsChange` will fire to update the state.
   */
  renderItem: (item: BoardProps.Item<D>, actions: BoardProps.ItemActions) => JSX.Element;

  /**
   * An object containing all the necessary localized strings required by the component.
   *
   * Live announcements:
   * * `liveAnnouncementDndStarted(BoardProps.DndOperationType): string` - the function to create a live announcement string to indicate start of DnD ("reorder", "resize" or "insert").
   * * `liveAnnouncementDndItemReordered(BoardProps.DndReorderState<D>): string` - the function to create a live announcement string to indicate when DnD reorder is performed.
   * * `liveAnnouncementDndItemResized(BoardProps.DndResizeState<D>): string` - the function to create a live announcement string to indicate when DnD resize is performed.
   * * `liveAnnouncementDndItemInserted(BoardProps.DndInsertState<D>): string` - the function to create a live announcement string to indicate when DnD insert is performed.
   * * `liveAnnouncementDndDiscarded(BoardProps.DndOperationType): string` - the function to create a live announcement string to indicate commit of DnD ("reorder", "resize" or "insert").
   * * `liveAnnouncementDndCommitted(BoardProps.DndOperationType): string` - the function to create a live announcement string to indicate discard of DnD ("reorder", "resize" or "insert").
   * * `liveAnnouncementItemRemoved(BoardProps.OperationStateRemove<D>): string` - the function to create a live announcement string to indicate when item is removed.
   *
   * Navigation labels:
   * * `navigationAriaLabel` (string) - the ARIA label for the accessible board navigation element.
   * * `navigationAriaDescription` (string, optional) - the ARIA description for the accessible board navigation element.
   * * `navigationItemAriaLabel(null | BoardProps.Item<D>): string` - the function to create the ARIA label for a navigation board item or an empty slot.
   */
  i18nStrings: BoardProps.I18nStrings<D>;

  /**
   * Fired when a user interaction changes size or position of board items.
   *
   * The change detail has the following properties:
   * * `items`: (readonly Item<D>[]) - the updated items array.
   * * `addedItem`: (Item<D>, optional) - the item that was added as part of the update, if available.
   * * `removedItem`: (Item<D>, optional) - the item that was removed as part of the update, if available.
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
  export type Data<D = DataFallbackType> = BoardData<D>;

  export type Item<D = DataFallbackType> = BoardItem<D>;

  export interface ItemActions {
    removeItem(): void;
  }

  export interface ItemsChangeDetail<D = DataFallbackType> {
    data: Data<D>;
    addedItem?: Item<D>;
    removedItem?: Item<D>;
  }

  export interface I18nStrings<D> {
    liveAnnouncementDndStarted: (operationType: DndOperationType) => string;
    liveAnnouncementDndItemReordered: (operation: DndReorderState<D>) => string;
    liveAnnouncementDndItemResized: (operation: DndResizeState<D>) => string;
    liveAnnouncementDndItemInserted: (operation: DndInsertState<D>) => string;
    liveAnnouncementDndCommitted: (operationType: DndOperationType) => string;
    liveAnnouncementDndDiscarded: (operationType: DndOperationType) => string;
    liveAnnouncementItemRemoved: (operation: ItemRemovedState<D>) => string;
    navigationAriaLabel: string;
    navigationAriaDescription?: string;
    navigationItemAriaLabel: (item: null | BoardProps.Item<D>) => string;
  }

  export type DndOperationType = "reorder" | "resize" | "insert";

  export interface ItemPlacement {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export interface DndReorderState<D> {
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }

  export interface DndInsertState<D> {
    item: Item<D>;
    placement: ItemPlacement;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }

  export interface DndResizeState<D> {
    item: Item<D>;
    placement: ItemPlacement;
    direction: "horizontal" | "vertical";
    isMinimalColumnsReached: boolean;
    isMinimalRowsReached: boolean;
    conflicts: readonly Item<D>[];
    disturbed: readonly Item<D>[];
  }

  export interface ItemRemovedState<D> {
    item: Item<D>;
    disturbed: readonly Item<D>[];
  }
}

export interface Transition<D> {
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  insertionDirection: null | Direction;
  draggableItem: BoardItem<D>;
  draggableElement: HTMLElement;
  acquiredItem: null | BoardItem<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  path: readonly Position[];
}

export interface RemoveTransition<D> {
  items: readonly BoardProps.Item<D>[];
  removedItem: BoardItem<D>;
  layoutShift: LayoutShift;
}

export type TransitionAnnouncement =
  | DndStartedAnnouncement
  | DndActionAnnouncement
  | DndCommittedAnnouncement
  | DndDiscardedAnnouncement
  | ItemRemovedAnnouncement;

export interface DndStartedAnnouncement {
  type: "dnd-started";
  item: BoardItem<unknown>;
  operation: Operation;
}
export interface DndActionAnnouncement {
  type: "dnd-action";
  item: BoardItem<unknown>;
  operation: Operation;
  placement: Omit<GridLayoutItem, "id">;
  direction: null | Direction;
  conflicts: Set<ItemId>;
  disturbed: Set<ItemId>;
}
export interface DndCommittedAnnouncement {
  type: "dnd-committed";
  item: BoardItem<unknown>;
  operation: Operation;
}
export interface DndDiscardedAnnouncement {
  type: "dnd-discarded";
  item: BoardItem<unknown>;
  operation: Operation;
}
export interface ItemRemovedAnnouncement {
  type: "item-removed";
  item: BoardItem<unknown>;
  disturbed: Set<ItemId>;
}
