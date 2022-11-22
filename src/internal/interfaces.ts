// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Meta-type to indicate item's ID.
export type ItemId = string;

export type DataFallbackType = Record<string, unknown>;

export interface ItemBase<D = DataFallbackType> {
  id: ItemId;
  definition: ItemDefinition;
  data: D;
}

export interface ItemDefinition {
  minRowSpan?: number;
  minColumnSpan?: number;
  defaultRowSpan: number;
  defaultColumnSpan: number;
}

// Internal grid item representation used for position calculations.
export interface GridLayoutItem {
  id: ItemId;
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Represents a point on a screen.
export interface Coordinates {
  pageX: number;
  pageY: number;
}

// Represents a point in the grid.
export interface Position {
  x: number;
  y: number;
}
