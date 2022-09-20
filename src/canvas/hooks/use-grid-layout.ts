// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CanvasItem } from "../interfaces";
import type { GridLayoutItem, GridProps } from "../../internal/grid";

interface UseGridLayoutProps<D> {
  items: CanvasItem<D>[];
  columns: number;
}

export default function useGridLayout<D>({ items, columns }: UseGridLayoutProps<D>) {
  const content = getContentLayoutItems(items, columns);
  const rows = content.reduce((acc, item) => Math.max(acc, item.rowOffset + item.rowSpan - 1), 1);
  const grid = getGridLayoutItems(rows, columns);
  return {
    content,
    grid,
    rows,
  };
}

function getContentLayoutItems<D>(items: CanvasItem<D>[], columns: number): GridProps["layout"] {
  const result: GridLayoutItem[] = [];

  let row = 1;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const next = index < items.length - 1 ? items[index + 1] : null;
    const rightEdge = item.columnOffset + item.columnSpan - 1;
    const remainingColumns = columns - rightEdge;

    result.push({
      ...item,
      rowOffset: row,
    });

    if (
      remainingColumns <= 0 ||
      (next && next.columnSpan > remainingColumns) ||
      (next && next.columnOffset <= item.columnOffset)
    ) {
      // Increment row count if the next item will not fit in the same row anymore
      row++;
    }
  }

  return result;
}

function getGridLayoutItems(rows: number, columns: number) {
  const result: GridLayoutItem[] = [];

  for (let rowOffset = 1; rowOffset <= rows; rowOffset++) {
    for (let columnOffset = 1; columnOffset <= columns; columnOffset++) {
      result.push({
        id: `${rowOffset}-${columnOffset}}`,
        rowOffset,
        columnOffset,
        rowSpan: 1,
        columnSpan: 1,
      });
    }
  }

  return result;
}
