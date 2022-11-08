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
  const result: GridLayoutItem[] = [];

  let currentRowIndex = 1;

  for (let index = 0; index < items.length; index++) {
    const { id, columnSpan, rowSpan, columnOffset } = items[index];
    const next = index < items.length - 1 ? items[index + 1] : null;
    const rightEdge = columnOffset + columnSpan - 1;
    const remainingColumns = columns - rightEdge;

    result.push({ id, width: columnSpan, height: rowSpan, x: columnOffset, y: currentRowIndex });

    if (
      remainingColumns <= 0 ||
      (next && next.columnSpan > remainingColumns) ||
      (next && next.columnOffset <= columnOffset)
    ) {
      // Increment row count if the next item will not fit in the same row anymore
      currentRowIndex++;
    }
  }

  return result;
}

function createGridPlaceholders(rows: number, columns: number): readonly GridLayoutItem[] {
  const result: GridLayoutItem[] = [];

  for (let x = 1; x <= columns; x++) {
    for (let y = 1; y <= rows; y++) {
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
  let rows = content.reduce((acc, item) => Math.max(acc, item.y + item.height - 1), 1);
  if (extraRow) {
    rows += 1;
  }
  const placeholders = createGridPlaceholders(rows, columns);
  return { content, placeholders, rows };
}
