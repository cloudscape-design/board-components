// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayoutItem, ItemId } from "../base-types";
import { Position } from "../interfaces";

export interface GridDefinition {
  items: readonly GridLayoutItem[];
  columns: number;
}

export interface MoveCommand {
  itemId: ItemId;
  path: readonly Position[];
}

export interface ResizeCommand {
  itemId: ItemId;
  width: number;
  height: number;
}

export interface CommittedMove {
  itemId: ItemId;
  x: number;
  y: number;
  type: "USER" | "VACANT" | "PRIORITY" | "ESCAPE" | "FLOAT";
}

export interface GridTransition {
  start: GridDefinition;
  end: GridDefinition;
  moves: readonly CommittedMove[];
  conflicts: readonly ItemId[];
}

export type Direction = "top" | "right" | "bottom" | "left";
