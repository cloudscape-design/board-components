// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DashboardItem, GridLayout, GridLayoutItem, ItemId } from "../interfaces";

export function createItemsLayout(items: readonly DashboardItem<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(columns).fill(-1);

  for (const { id, columnSpan, rowSpan, columnOffset } of items) {
    let itemRow = 0;
    for (let col = columnOffset; col < columnOffset + columnSpan; col++) {
      itemRow = Math.max(itemRow, colAffordance[col] + 1);
    }
    layoutItems.push({ id, width: columnSpan, height: rowSpan, x: columnOffset, y: itemRow });
    for (let col = columnOffset; col < columnOffset + columnSpan; col++) {
      colAffordance[col] = itemRow + rowSpan - 1;
    }
  }

  const rows = Math.max(...colAffordance) + 1;

  return { items: layoutItems, columns, rows };
}

export function createPlaceholdersLayout(rows: number, columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];

  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      layoutItems.push({ id: `placeholder-${x}-${y}`, x, y, width: 1, height: 1 });
    }
  }

  return { items: layoutItems, columns, rows };
}

export function exportItemsLayout<D>(
  grid: GridLayout,
  sourceItems: readonly DashboardItem<D>[]
): readonly DashboardItem<D>[] {
  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  const getItem = (itemId: ItemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = grid.items.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  const dashboardItems: DashboardItem<D>[] = [];
  for (const { id, x, width, height } of sortedLayout) {
    dashboardItems.push({ ...getItem(id), columnOffset: x, columnSpan: width, rowSpan: height });
  }
  return dashboardItems;
}
