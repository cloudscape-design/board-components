// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Meta-type to indicate item's ID.
export type ItemId = string;

export type DataFallbackType = Record<string, unknown>;

export type Percentage = number;

export interface BoardItemDefinitionBase<D = DataFallbackType> {
  id: ItemId;
  definition?: {
    minColumnSpan?: Percentage;
    defaultColumnSpan?: Percentage;
    minRows?: number;
    defaultRows?: number;
  };
  data: D;
}

export interface BoardItemDefinition<D = DataFallbackType> extends BoardItemDefinitionBase<D> {
  columnOffset: Percentage;
  columnSpan: Percentage;
  rowSpan: number;
}

// Internal grid item representation used for position calculations.
export interface GridLayout {
  items: readonly GridLayoutItem[];
  columns: number;
  rows: number;
}

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

export type Transform = TransformMove | TransformRemove;
export interface TransformMove {
  type: "move";
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface TransformRemove {
  type: "remove";
}

export type Direction = "up" | "right" | "down" | "left";
