// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COLUMNS_M, COLUMNS_XS, MIN_COL_SPAN, MIN_ROW_SPAN } from "../constants";
import { BoardItemDefinition, BoardItemDefinitionBase, GridLayout, GridLayoutItem, ItemId } from "../interfaces";

export function createItemsLayout(items: readonly BoardItemDefinition<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(columns).fill(-1);

  for (const { id, columnSpan, rowSpan, columnOffset, definition } of items) {
    const startCol = Math.min(columns - 1, columnOffset);
    const normalizedColumnSpan = Math.max(
      definition?.minColumnSpan ?? MIN_COL_SPAN,
      Math.min(columns - startCol, getColumnSpanForColumns(columnSpan, columns))
    );
    const allowedRowSpan = Math.max(MIN_ROW_SPAN, definition?.minRowSpan ?? MIN_ROW_SPAN, rowSpan);

    let itemRow = 0;
    for (let col = startCol; col < startCol + normalizedColumnSpan; col++) {
      itemRow = Math.max(itemRow, colAffordance[col] + 1);
    }

    layoutItems.push({ id, width: normalizedColumnSpan, height: allowedRowSpan, x: startCol, y: itemRow });

    for (let col = startCol; col < startCol + normalizedColumnSpan; col++) {
      colAffordance[col] = itemRow + allowedRowSpan - 1;
    }
  }

  const rows = Math.max(...colAffordance) + 1;

  layoutItems.sort(itemComparator);

  return { items: layoutItems, columns, rows };
}

function getColumnSpanForColumns(columnSpan: number, columns: number) {
  if (columns === COLUMNS_XS) {
    return 1;
  }
  if (columns === COLUMNS_M) {
    return columnSpan <= 2 ? 1 : 2;
  }
  return columnSpan;
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

export function exportItemsLayout<D>(
  grid: GridLayout,
  sourceItems: readonly (BoardItemDefinitionBase<D> | BoardItemDefinition<D>)[],
  columns: number
): readonly BoardItemDefinition<D>[] {
  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  const getItem = (itemId: ItemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = grid.items.slice().sort(itemComparator);

  const boardItems: BoardItemDefinition<D>[] = [];
  for (const { id, x, width, height } of sortedLayout) {
    const item = getItem(id);

    let columnOffset = x;
    let columnSpan = width;
    if (columns === COLUMNS_XS && "columnOffset" in item && "columnSpan" in item) {
      columnOffset = item.columnOffset;
      columnSpan = item.columnSpan;
    }
    if (columns === COLUMNS_M) {
      columnOffset = x * 2;
      columnSpan = width * 2;
    }

    boardItems.push({ ...item, columnOffset, columnSpan, rowSpan: height });
  }
  return boardItems;
}

export function getMinItemSize(item: BoardItemDefinitionBase<unknown>) {
  return {
    width: Math.max(MIN_COL_SPAN, item.definition?.minColumnSpan ?? MIN_COL_SPAN),
    height: Math.max(MIN_ROW_SPAN, item.definition?.minRowSpan ?? MIN_ROW_SPAN),
  };
}

export function getDefaultItemSize(item: BoardItemDefinitionBase<unknown>) {
  return {
    width: Math.max(getMinItemSize(item).width, item.definition?.defaultColumnSpan ?? MIN_COL_SPAN),
    height: Math.max(getMinItemSize(item).height, item.definition?.defaultRowSpan ?? MIN_ROW_SPAN),
  };
}

function itemComparator(a: GridLayoutItem, b: GridLayoutItem) {
  if (a.y !== b.y) {
    return a.y > b.y ? 1 : -1;
  }
  return a.x > b.x ? 1 : -1;
}
