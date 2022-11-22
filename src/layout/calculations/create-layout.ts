// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayout, GridLayoutItem } from "../../internal/interfaces";
import { DashboardLayoutProps } from "../interfaces";

function createGridItems(
  items: readonly DashboardLayoutProps.Item<unknown>[],
  columns: number
): readonly GridLayoutItem[] {
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

  return layoutItems;
}

function createGridPlaceholders(rows: number, columns: number): readonly GridLayoutItem[] {
  const result: GridLayoutItem[] = [];

  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {
      result.push({ id: `placeholder-${x}-${y}`, x, y, width: 1, height: 1 });
    }
  }

  return result;
}

export function createItemsLayout(
  data: ReadonlyArray<DashboardLayoutProps.Item<unknown>>,
  columns: number,
  activeDragItem: null | GridLayoutItem
): GridLayout {
  const items = createGridItems(data, columns);
  let rows = items.reduce((acc, item) => Math.max(acc, item.y + item.height), 1);
  if (activeDragItem) {
    rows += activeDragItem.height;
  }
  return { items, columns, rows };
}

export function createPlaceholdersLayout(rows: number, columns: number): GridLayout {
  const items = createGridPlaceholders(rows, columns);
  return { items, columns, rows };
}
