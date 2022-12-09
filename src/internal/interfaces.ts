// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Meta-type to indicate item's ID.
export type ItemId = string;

export type DataFallbackType = Record<string, unknown>;

export interface DashboardItemBase<D = DataFallbackType> {
  id: ItemId;
  definition: DashboardItemDefinition;
  data: D;
}

export interface DashboardItemDefinition {
  minRowSpan?: number;
  minColumnSpan?: number;
  defaultRowSpan: number;
  defaultColumnSpan: number;
}

export interface DashboardItem<D = DataFallbackType> extends DashboardItemBase<D> {
  columnOffset: number;
  rowSpan: number;
  columnSpan: number;
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

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Represents a point in the grid.
export interface Position {
  x: number;
  y: number;
}

export type Direction = "up" | "right" | "down" | "left";
