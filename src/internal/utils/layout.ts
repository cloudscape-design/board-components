// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_COL_SPAN, MIN_ROW_SPAN } from "../constants";
import {
  BoardItem,
  BoardItemColumnSpan,
  BoardLayout,
  BoardLayoutEntry,
  GridLayout,
  GridLayoutItem,
  ItemId,
} from "../interfaces";

/**
 * The function produces grid layout from board items and given number of columns.
 * The positional data is taken from the items when available or the default placement is used otherwise.
 */
export function interpretItems<D>(items: readonly BoardItem<D>[], layout: BoardLayout, columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const layoutData = layout[columns];
  const columnHeights = Array(columns).fill(0);

  function getColumnSpan(index: number): number {
    const minColumnSpan = getItemMinColumnSpan(items[index], columns);
    const columnSpan = layoutData?.[index]?.columnSpan ?? getItemDefaultColumnSpan(items[index], columns);
    return Math.max(minColumnSpan, columnSpan);
  }

  function getRowSpan(index: number): number {
    const minRowSpan = getItemMinRowSpan(items[index]);
    const rowSpan = layoutData?.[index]?.rowSpan ?? getItemDefaultRowSpan(items[index]);
    return Math.max(minRowSpan, rowSpan);
  }

  function getColumnOffset(index: number, currentOffset: number): number {
    const columnSpan = getColumnSpan(index);
    const rowSpan = getRowSpan(index);
    return layoutData?.[index]?.columnOffset ?? findOptimalColumnOffset(currentOffset, columnSpan, rowSpan);
  }

  function findOptimalColumnOffset(currentColumnOffset: number, columnSpan: number, rowSpan: number): number {
    for (let colOffset = currentColumnOffset; colOffset + columnSpan <= columns; colOffset++) {
      if (getRowOffset(colOffset, columnSpan) + rowSpan <= getRowOffset(0, columns)) {
        return colOffset;
      }
    }
    for (let colOffset = 0; colOffset + columnSpan <= columns; colOffset++) {
      if (getRowOffset(colOffset, columnSpan) + rowSpan <= getRowOffset(0, columns)) {
        return colOffset;
      }
    }
    return currentColumnOffset + columnSpan <= columns ? currentColumnOffset : 0;
  }

  function getRowOffset(columnOffset: number, columnSpan: number) {
    let rowOffset = 0;
    for (let col = columnOffset; col < columnOffset + columnSpan; col++) {
      rowOffset = Math.max(rowOffset, columnHeights[col]);
    }
    return rowOffset;
  }

  for (let index = 0, columnOffset = 0, rowOffset = 0; index < items.length; index++, rowOffset = 0) {
    const columnSpan = getColumnSpan(index);
    const rowSpan = getRowSpan(index);
    columnOffset = getColumnOffset(index, columnOffset);
    rowOffset = getRowOffset(columnOffset, columnSpan);

    layoutItems.push({ id: items[index].id, width: columnSpan, height: rowSpan, x: columnOffset, y: rowOffset });

    for (let col = columnOffset; col < columnOffset + columnSpan; col++) {
      columnHeights[col] = rowOffset + rowSpan;
    }

    columnOffset += columnSpan;
  }

  layoutItems.sort(itemComparator);

  return { items: layoutItems, columns, rows: getRowOffset(0, columns) };
}

/**
 * The function produces new items from the current state and updated grid layout.
 * The positional data for the given number of columns is preserved as is while the other layouts are partially invalidated.
 */
export function transformItems<D>(
  sourceItems: readonly BoardItem<D>[],
  sourceLayout: BoardLayout,
  gridLayout: GridLayout
): { items: readonly BoardItem<D>[]; layout: BoardLayout } {
  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  const getItem = (itemId: ItemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = gridLayout.items.slice().sort(itemComparator);

  const items: BoardItem<D>[] = [];
  const layout: { [columns: number]: BoardLayoutEntry[] } = {};
  const layoutKeys = Object.keys(sourceLayout).map((k) => parseInt(k));

  let changeFromIndex = sortedLayout.findIndex(({ id }, index) => sourceItems[index].id !== id);
  changeFromIndex = changeFromIndex !== -1 ? changeFromIndex : sortedLayout.length - 1;

  function updateSourceLayout(key: number, index: number) {
    if (key === gridLayout.columns) {
      return;
    }

    const sourceLayoutEntry = sourceLayout[key];
    if (!layout[key]) {
      layout[key] = [];
    }
    if (index < changeFromIndex && sourceLayoutEntry[index]) {
      layout[key].push(sourceLayoutEntry[index]);
    } else {
      const originalIndex = sourceItems.findIndex(({ id }) => id === items[index].id);
      const columnSpan = sourceLayoutEntry?.[originalIndex]?.columnSpan;
      const rowSpan = sourceLayoutEntry?.[originalIndex]?.rowSpan;
      layout[key].push({ columnSpan, rowSpan });
    }
  }

  function writeCurrentLayout(columnOffset: number, columnSpan: number, rowSpan: number) {
    if (!layout[gridLayout.columns]) {
      layout[gridLayout.columns] = [];
    }
    layout[gridLayout.columns].push({ columnOffset, columnSpan, rowSpan });
  }

  for (let index = 0; index < sortedLayout.length; index++) {
    const { id, x, width, height } = sortedLayout[index];

    items.push(getItem(id));

    for (const layoutKey of layoutKeys) {
      updateSourceLayout(layoutKey, index);
    }

    writeCurrentLayout(x, width, height);
  }

  return { items, layout };
}

export function createPlaceholdersLayout(rows: number, columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      layoutItems.push({ id: `awsui-placeholder-${row}-${col}`, x: col, y: row, width: 1, height: 1 });
    }
  }

  return { items: layoutItems, columns, rows };
}

export function getItemMinColumnSpan(item: BoardItem<unknown>, columns: number) {
  return Math.max(MIN_COL_SPAN, getColumnSpanForColumns(item.minColumnSpan, columns));
}

export function getItemDefaultColumnSpan(item: BoardItem<unknown>, columns: number) {
  return Math.min(
    columns,
    Math.max(getItemMinColumnSpan(item, columns), getColumnSpanForColumns(item.defaultColumnSpan, columns))
  );
}

function getColumnSpanForColumns(columnSpan: BoardItemColumnSpan | undefined, columns: number): number {
  if (!columnSpan) {
    return MIN_COL_SPAN;
  }
  for (let i = columns; i >= 0; i--) {
    if (columnSpan[i] !== undefined) {
      return columnSpan[i];
    }
  }
  return MIN_COL_SPAN;
}

export function getItemMinRowSpan(item: BoardItem<unknown>) {
  return Math.max(MIN_ROW_SPAN, item.minRowSpan ?? 0);
}

export function getItemDefaultRowSpan(item: BoardItem<unknown>) {
  return Math.max(getItemMinRowSpan(item), item.defaultRowSpan ?? 0);
}

function itemComparator(a: GridLayoutItem, b: GridLayoutItem) {
  if (a.y !== b.y) {
    return a.y > b.y ? 1 : -1;
  }
  return a.x > b.x ? 1 : -1;
}
