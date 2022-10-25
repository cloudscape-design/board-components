// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import type { CanvasItem } from "./interfaces";
import type { GridLayoutItem } from "../internal/grid/index";

export function createContentGridItems(items: CanvasItem<any>[], columns: number): GridLayoutItem[] {
  const result: GridLayoutItem[] = [];

  let rowOffset = 1;

  for (let index = 0; index < items.length; index++) {
    const { id, columnSpan, rowSpan, columnOffset } = items[index];
    const next = index < items.length - 1 ? items[index + 1] : null;
    const rightEdge = columnOffset + columnSpan - 1;
    const remainingColumns = columns - rightEdge;

    result.push({ id, columnSpan, rowSpan, columnOffset, rowOffset });

    if (
      remainingColumns <= 0 ||
      (next && next.columnSpan > remainingColumns) ||
      (next && next.columnOffset <= columnOffset)
    ) {
      // Increment row count if the next item will not fit in the same row anymore
      rowOffset++;
    }
  }

  return result;
}

export function createPlaceholderGridItems(rows: number, columns: number): GridLayoutItem[] {
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
