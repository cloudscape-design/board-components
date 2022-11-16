// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CommittedMove, Item, ItemId } from "./public-interfaces";

export type Direction = "top" | "right" | "bottom" | "left";

export interface DndGrid {
  width: number;
  layout: DndGridCell[][];
  moves: CommittedMove[];
  conflicts: ItemId[];
  blocks: Set<ItemId>;
  getItem: (id: ItemId) => DndItem;
}

export interface DndItem extends Item {
  priority: number;
  originalX: number;
  originalY: number;
}

export type DndGridCell = ItemId[];
