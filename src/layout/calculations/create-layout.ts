// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { DashboardLayoutProps } from "../interfaces";

interface GridLayout {
  content: readonly GridLayoutItem[];
  placeholders: readonly GridLayoutItem[];
  rows: number;
}

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
      colAffordance[col] = itemRow;
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

export function createLayout(
  items: ReadonlyArray<DashboardLayoutProps.Item<unknown>>,
  columns: number,
  extraRow: boolean
): GridLayout {
  const content = createGridItems(items, columns);
  let rows = content.reduce((acc, item) => Math.max(acc, item.y + item.height), 1);
  if (extraRow) {
    rows += 1;
  }
  const placeholders = createGridPlaceholders(rows, columns);
  return { content, placeholders, rows };
}
