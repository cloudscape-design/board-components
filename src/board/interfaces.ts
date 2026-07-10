// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";

import { NonCancelableEventHandler } from "../types/events";

export type DataFallbackType = Record<string, unknown>;

/*
  Note:
  The component does not provide handling of items state (loading, error, loaded).
  It is the responsibility of the client to control it and provide the necessary
  ARIA-live announcements.
*/

export interface BoardProps<D = DataFallbackType> {
  /**
   * Specifies the items displayed in the board. Each item includes its position on the board and
   * optional data. The content of an item is controlled by the `renderItem` property.
   *
   * The BoardProps.Item includes:
   * * `id` (string) - the unique item identifier. The IDs of any two items in a page must be different.
   * * `definition.minRowSpan` (number, optional) - the minimal number of rows the item is allowed to take. It can't be less than two. Defaults to two.
   * * `definition.minColumnSpan` (number, optional) - the minimal number of columns the item is allowed to take. It can't be less than one. Defaults to one.
   * * `definition.defaultRowSpan` (number, optional) - the number or rows the item will take when inserted to the board. It can't be less than `definition.minRowSpan`.
   * * `definition.defaultColumnSpan` (number, optional) - the number or columns the item will take when inserted in the board. It can't be less than `definition.minColumnSpan`.
   * * `columnOffset` (mapping, optional) - the item's offset from the first column (per layout) starting from zero. The value is updated by `onItemsChange` after an update is committed.
   * * `rowSpan` (number, optional) - the item's vertical size starting from two. The value is updated by `onItemsChange` after an update is committed.
   * * `columnSpan` (number, optional) - the item's horizontal size starting from one. The value is updated by `onItemsChange` after an update is committed.
   * * `data` (D) - optional item data which can include the specific configurations of an item, such as its title.
   */
  items: ReadonlyArray<BoardProps.Item<D>>;

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
   */
  i18nStrings: BoardProps.I18nStrings<D>;

  /**
   * Called when a user modifies the size or position of board items.
   *
   * The change detail has the following properties:
   *
   * * `items`: (readonly Item<D>[]) - the updated items array.
   * * `addedItem`: (Item<D>, optional) - the item that was added as part of the update, if applicable.
   * * `removedItem`: (Item<D>, optional) - the item that was removed as part of the update, if applicable.
   * * `resizedItem`: (Item<D>, optional) - the item that was resized as part of the update, if applicable.
   * * `movedItem`: (Item<D>, optional) - the item that was moved as part of the update, if applicable.
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
  export interface Item<D = DataFallbackType> {
    id: string;
    data: D;
    definition?: { minRowSpan?: number; minColumnSpan?: number; defaultRowSpan?: number; defaultColumnSpan?: number };
    columnOffset?: { [columns: number]: number };
    rowSpan?: number;
    columnSpan?: number;
  }

  export interface ItemActions {
    removeItem(): void;
  }

  export interface ItemsChangeDetail<D = DataFallbackType> {
    items: ReadonlyArray<Item<D>>;
    movedItem?: Item<D>;
    resizedItem?: Item<D>;
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

    /** @deprecated Has no effect. */
    navigationAriaLabel: string;
    /** @deprecated Has no effect. */
    navigationAriaDescription?: string;
    /** @deprecated Has no effect. */
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
