// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ROW_SPAN } from "../constants";
import { BoardItemDefinition, BoardItemDefinitionBase, GridLayout, GridLayoutItem, ItemId } from "../interfaces";

export function createItemsLayout(items: readonly BoardItemDefinition<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(columns).fill(-1);

  for (const { id, columnSpan, rowSpan, columnOffset, definition } of items) {
    const startCol = Math.min(columns - 1, columnOffset);
    const allowedColSpan = Math.min(
      columns,
      Math.max(definition.minColumnSpan ?? 1, Math.min(columns - startCol, columnSpan))
    );
    const allowedRowSpan = Math.max(MIN_ROW_SPAN, definition.minRowSpan ?? 1, rowSpan);

    let itemRow = 0;
    for (let col = startCol; col < startCol + allowedColSpan; col++) {
      itemRow = Math.max(itemRow, colAffordance[col] + 1);
    }

    layoutItems.push({ id, width: allowedColSpan, height: allowedRowSpan, x: startCol, y: itemRow });

    for (let col = startCol; col < startCol + allowedColSpan; col++) {
      colAffordance[col] = itemRow + allowedRowSpan - 1;
    }
  }

  const rows = Math.max(...colAffordance) + 1;

  layoutItems.sort(itemComparator);

  return { items: layoutItems, columns, rows };
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
  sourceItems: readonly BoardItemDefinitionBase<D>[]
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
    boardItems.push({ ...getItem(id), columnOffset: x, columnSpan: width, rowSpan: height });
  }
  return boardItems;
}

export function getMinItemSize(item: BoardItemDefinitionBase<unknown>) {
  return {
    width: Math.max(1, item.definition.minColumnSpan ?? 1),
    height: Math.max(MIN_ROW_SPAN, item.definition.minRowSpan ?? 1),
  };
}

export function getDefaultItemSize(item: BoardItemDefinitionBase<unknown>) {
  return {
    width: Math.max(getMinItemSize(item).width, item.definition.defaultColumnSpan),
    height: Math.max(getMinItemSize(item).height, item.definition.defaultRowSpan),
  };
}

function itemComparator(a: GridLayoutItem, b: GridLayoutItem) {
  if (a.y !== b.y) {
    return a.y > b.y ? 1 : -1;
  }
  return a.x > b.x ? 1 : -1;
}
