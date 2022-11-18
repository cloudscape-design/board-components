// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface GridDefinition {
  items: readonly Item[];
  width: number;
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

export interface Position {
  x: number;
  y: number;
}

export type ItemId = string;

export interface Item {
  id: ItemId;
  x: number;
  y: number;
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
  moves: CommittedMove[];
  blocks: ItemId[];
}

export type Direction = "top" | "right" | "bottom" | "left";
