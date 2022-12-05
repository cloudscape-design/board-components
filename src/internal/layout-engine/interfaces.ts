// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, ItemId, Position } from "../interfaces";

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
  type: "USER" | "VACANT" | "PRIORITY" | "ESCAPE" | "FLOAT" | "RESIZE" | "INSERT";
}

export interface LayoutShift {
  current: GridLayout;
  next: GridLayout;
  moves: readonly CommittedMove[];
  conflicts: readonly ItemId[];
}

export type Direction = "top" | "right" | "bottom" | "left";
