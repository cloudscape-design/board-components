// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode } from "react";

import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import { BoardItemDefinitionBase, Direction, GridLayout, GridLayoutItem, ItemId, Rect } from "../internal/interfaces";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import { Position } from "../internal/utils/position";
import { BoardProps } from "./interfaces";

export interface Transition<D> {
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  layoutEngine: LayoutEngine;
  insertionDirection: null | Direction;
  draggableItem: BoardItemDefinitionBase<D>;
  draggableRect: Rect;
  acquiredItem: null | BoardItemDefinitionBase<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  path: readonly Position[];
  acquiredItemElement?: ReactNode;
}

export interface RemoveTransition<D> {
  items: readonly BoardProps.Item<D>[];
  removedItem: BoardItemDefinitionBase<D>;
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
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface DndActionAnnouncement {
  type: "dnd-action";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
  placement: Omit<GridLayoutItem, "id">;
  direction: null | Direction;
  conflicts: Set<ItemId>;
  disturbed: Set<ItemId>;
}
export interface DndCommittedAnnouncement {
  type: "dnd-committed";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface DndDiscardedAnnouncement {
  type: "dnd-discarded";
  item: BoardItemDefinitionBase<unknown>;
  operation: Operation;
}
export interface ItemRemovedAnnouncement {
  type: "item-removed";
  item: BoardItemDefinitionBase<unknown>;
  disturbed: Set<ItemId>;
}
