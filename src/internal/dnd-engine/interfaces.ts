// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type ItemId = string;

export interface Position {
  x: number;
  y: number;
}

export interface MovePath {
  itemId: ItemId;
  path: Position[];
}

export interface Resize {
  itemId: ItemId;
  width: number;
  height: number;
}

export type Direction = "top" | "right" | "bottom" | "left";

export interface Item {
  id: ItemId;
  x: number;
  y: number;
  height: number;
  width: number;
}

export interface GridDefinition {
  items: Item[];
  width: number;
}

export type MoveType = "USER" | "VACANT" | "PRIORITY" | "ESCAPE" | "FLOAT";

export interface Move {
  itemId: ItemId;
  x: number;
  y: number;
  type: MoveType;
}

export interface GridTransition {
  start: GridDefinition;
  end: GridDefinition;
  moves: Move[];
  blocks: ItemId[];
}

export interface DndGrid {
  width: number;
  layout: DndGridCell[][];
  moves: Move[];
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
