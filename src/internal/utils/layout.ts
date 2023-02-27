// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COLUMNS_DEFAULT, MIN_COL_SPAN, MIN_ROW_SPAN } from "../constants";
import {
  BoardItem,
  BoardItemColumnSpan,
  BoardLayout,
  BoardLayoutEntry,
  GridLayout,
  GridLayoutItem,
  ItemId,
} from "../interfaces";
import { LayoutShift } from "../layout-engine/interfaces";

export function createItemsLayout<D>(items: readonly BoardItem<D>[], layout: BoardLayout, columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(COLUMNS_DEFAULT * 2).fill(0);

  let currentColumnOffset = 0;
  const columnsLayout = layout[columns];

  function getColumnSpan(index: number): number {
    const minColumnSpan = getItemMinColumnSpan(items[index], columns);
    const columnSpan = columnsLayout?.[index]?.columnSpan ?? getItemDefaultColumnSpan(items[index], columns);
    return Math.max(minColumnSpan, columnSpan);
  }

  function getRowSpan(index: number): number {
    const minRowSpan = getItemMinRowSpan(items[index]);
    const rowSpan = columnsLayout?.[index]?.rowSpan ?? getItemDefaultRowSpan(items[index]);
    return Math.max(minRowSpan, rowSpan);
  }

  function findOptimalColumnOffset(colSpan: number, rowSpan: number): number {
    const rows = Math.max(...colAffordance);
    for (let colOffset = currentColumnOffset; colOffset + colSpan <= columns; colOffset++) {
      let nextRows = 0;
      for (let spanIndex = 0; spanIndex < colSpan; spanIndex++) {
        nextRows = Math.max(nextRows, colAffordance[colOffset + spanIndex] + rowSpan);
      }
      if (nextRows <= rows) {
        return colOffset;
      }
    }
    for (let colOffset = 0; colOffset + colSpan <= columns; colOffset++) {
      let nextRows = 0;
      for (let spanIndex = 0; spanIndex < colSpan; spanIndex++) {
        nextRows = Math.max(nextRows, colAffordance[colOffset + spanIndex] + rowSpan);
      }
      if (nextRows <= rows) {
        return colOffset;
      }
    }
    return currentColumnOffset + colSpan <= columns ? currentColumnOffset : 0;
  }

  for (let index = 0; index < items.length; index++) {
    const colSpan = getColumnSpan(index);
    const rowSpan = getRowSpan(index);
    currentColumnOffset = columnsLayout?.[index]?.columnOffset ?? findOptimalColumnOffset(colSpan, rowSpan);

    let currentRowOffset = 0;
    for (let col = currentColumnOffset; col < currentColumnOffset + colSpan; col++) {
      currentRowOffset = Math.max(currentRowOffset, colAffordance[col]);
    }

    layoutItems.push({
      id: items[index].id,
      width: colSpan,
      height: rowSpan,
      x: currentColumnOffset,
      y: currentRowOffset,
    });

    for (let col = currentColumnOffset; col < currentColumnOffset + colSpan; col++) {
      colAffordance[col] = currentRowOffset + rowSpan;
    }

    currentColumnOffset += colSpan;
  }

  const rows = Math.max(...colAffordance);

  layoutItems.sort(itemComparator);

  return { items: layoutItems, columns, rows };
}

export function exportItemsLayout<D>(
  layoutShift: LayoutShift,
  sourceItems: readonly BoardItem<D>[],
  sourceLayout: BoardLayout,
  columns: number
): { items: readonly BoardItem<D>[]; layout: BoardLayout } {
  // No changes are needed when no moves are committed.
  if (layoutShift.moves.length === 0) {
    return { items: sourceItems, layout: sourceLayout };
  }

  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  const getItem = (itemId: ItemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = layoutShift.next.items.slice().sort(itemComparator);

  const items: BoardItem<D>[] = [];
  const layout: { [columns: number]: BoardLayoutEntry[] } = {};
  const layoutKeys = Object.keys(sourceLayout).map((k) => parseInt(k));
  const changeFromIndex = sortedLayout.findIndex(({ id }, index) => sourceItems[index].id !== id);

  function updateSourceLayout(key: number, index: number) {
    if (key === columns) {
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
    if (!layout[columns]) {
      layout[columns] = [];
    }
    layout[columns].push({ columnOffset, columnSpan, rowSpan });
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
