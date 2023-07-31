// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";

export interface MoveCommand {
  itemId: ItemId;
  path: readonly Position[];
}

export interface ResizeCommand {
  itemId: ItemId;
  path: readonly Position[];
}

export interface InsertCommand {
  itemId: ItemId;
  width: number;
  height: number;
  path: readonly Position[];
}

export interface CommittedMove {
  itemId: ItemId;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "MOVE" | "RESIZE" | "INSERT" | "REMOVE" | "OVERLAP" | "FLOAT";
  direction: Direction;
  distanceX: number;
  distanceY: number;
  score: number;
}

export interface LayoutShift {
  current: GridLayout;
  next: GridLayout;
  moves: readonly CommittedMove[];
  conflicts: readonly ItemId[];
}
