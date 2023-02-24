// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COLUMNS_DEFAULT, MIN_COL_SPAN, MIN_ROW_SPAN } from "../constants";
import {
  BoardData,
  BoardItem,
  BoardItemColumnSpan,
  BoardLayoutEntry,
  GridLayout,
  GridLayoutItem,
  ItemId,
} from "../interfaces";
import { LayoutShift } from "../layout-engine/interfaces";

export function createItemsLayout({ items, layout }: BoardData<unknown>, columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(COLUMNS_DEFAULT * 2).fill(0);

  let currentColumnOffset = 0;
  const columnsLayout = layout[columns];

  function getColumnOffset(index: number): number {
    return columnsLayout?.[index].columnOffset ?? currentColumnOffset;
  }

  function getColumnSpan(index: number): number {
    const minColumnSpan = getItemMinColumnSpan(items[index], columns);
    const columnSpan = columnsLayout?.[index].columnSpan ?? getItemDefaultColumnSpan(items[index], columns);
    return Math.max(minColumnSpan, columnSpan);
  }

  function getRowSpan(index: number): number {
    const minRowSpan = getItemMinRowSpan(items[index]);
    const rowSpan = columnsLayout?.[index].rowSpan ?? getItemDefaultRowSpan(items[index]);
    return Math.max(minRowSpan, rowSpan);
  }

  for (let index = 0; index < items.length; index++) {
    currentColumnOffset = getColumnOffset(index);
    const colSpan = getColumnSpan(index);
    const rowSpan = getRowSpan(index);

    if (currentColumnOffset + colSpan > columns) {
      currentColumnOffset = 0;
    }

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
  sourceBoardData: BoardData<D>,
  columns: number
): BoardData<D> {
  // No changes are needed when no moves are committed.
  if (layoutShift.moves.length === 0) {
    return sourceBoardData;
  }

  const itemById = new Map(sourceBoardData.items.map((item) => [item.id, item]));
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
  const layoutKeys = Object.keys(sourceBoardData.layout).map((k) => parseInt(k));
  const changeFromIndex = sortedLayout.findIndex(({ id }, index) => sourceBoardData.items[index].id !== id);

  function updateSourceLayout(key: number, index: number, newOffset: number) {
    if (key === columns) {
      return;
    }

    const sourceLayout = sourceBoardData.layout[key];
    if (!layout[key]) {
      layout[key] = [];
    }
    const columnOffset = index < changeFromIndex ? sourceLayout[index]?.columnOffset ?? newOffset : newOffset;
    const columnSpan = sourceLayout[index]?.columnSpan ?? getItemDefaultColumnSpan(items[index], key);
    const rowSpan = sourceLayout[index]?.rowSpan ?? getItemDefaultRowSpan(items[index]);
    layout[key].push({ columnOffset, columnSpan, rowSpan });
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
      updateSourceLayout(layoutKey, index, x);
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

  for (let i = columns; i <= COLUMNS_DEFAULT; i++) {
    if (columnSpan[i]) {
      return columnSpan[i];
    }
  }
  return columnSpan.default ?? MIN_COL_SPAN;
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
