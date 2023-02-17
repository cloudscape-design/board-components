// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COLUMNS_DEFAULT, COLUMNS_M, COLUMNS_XS, MIN_COL_SPAN, MIN_ROW_SPAN } from "../constants";
import { BoardItemDefinition, BoardItemDefinitionBase, GridLayout, GridLayoutItem, ItemId } from "../interfaces";
import { LayoutShift } from "../layout-engine/interfaces";

export function createItemsLayout(items: readonly BoardItemDefinition<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(COLUMNS_DEFAULT * 2).fill(-1);

  for (const item of items) {
    const startCol = Math.min(columns - 1, item.columnOffset);
    const minSize = getMinItemSize(item);
    const allowedColSpan = Math.min(
      columns - startCol,
      adjustColumnSpanForColumns(Math.max(minSize.width, item.columnSpan), columns)
    );
    const allowedRowSpan = Math.max(minSize.height, item.rowSpan);

    let itemRow = 0;
    for (let col = startCol; col < startCol + allowedColSpan; col++) {
      itemRow = Math.max(itemRow, colAffordance[col] + 1);
    }

    layoutItems.push({ id: item.id, width: allowedColSpan, height: allowedRowSpan, x: startCol, y: itemRow });

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
  layoutShift: LayoutShift,
  sourceItems: readonly (BoardItemDefinitionBase<D> | BoardItemDefinition<D>)[],
  columns: number
): readonly BoardItemDefinition<D>[] {
  // No changes are needed when no moves are committed.
  if (layoutShift.moves.length === 0) {
    return sourceItems as BoardItemDefinition<D>[];
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

  const resizeTargets = new Set(layoutShift.moves.filter((m) => m.type === "RESIZE").map((m) => m.itemId));
  const moveTargets = new Set(
    layoutShift.moves.filter((m) => m.type !== "RESIZE" && m.type !== "FLOAT").map((m) => m.itemId)
  );

  const boardItems: BoardItemDefinition<D>[] = [];
  for (const { id, x, width, height } of sortedLayout) {
    const item = getItem(id);

    // Column offset and column span values are taken as is from the layout shift for default layout but kept unchanged for mobile and tablet layout.
    // That means that the layout updates applied when in mobile or tablet layout are only partially applied.
    let columnOffset = x;
    let columnSpan = width;
    if (columns === COLUMNS_XS || columns === COLUMNS_M) {
      columnOffset = "columnOffset" in item ? item.columnOffset : x;
      columnSpan = "columnSpan" in item ? item.columnSpan : getDefaultItemSize(item).width;
    }

    // Partial items update when a change is made in tablet layout.
    if (columns === COLUMNS_M) {
      // When resize happens only update target item's column/row span.
      // Other layout changes will be automatically adjusted from the items structure.
      if (resizeTargets.has(id)) {
        columnSpan = width * 2;
      }
      // When move/resize happens and no more than two items are affected (assuming simple swap) only update those.
      // In that case we can likely maintain the original layout in an acceptable state.
      else if (resizeTargets.size === 0 && moveTargets.size <= 2) {
        if (moveTargets.has(id)) {
          columnOffset = x * 2;
          columnSpan = width * 2;
        }
      }
      // When there are more than two items moved "scale" the 2-column layout to default.
      else if (resizeTargets.size === 0) {
        columnOffset = x * 2;
        columnSpan = width * 2;
      }
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

export function adjustColumnSpanForColumns(columnSpan: number, columns: number) {
  if (columns === COLUMNS_XS) {
    return 1;
  }
  if (columns === COLUMNS_M) {
    return columnSpan <= 2 ? 1 : 2;
  }
  return Math.min(columns, columnSpan);
}

function itemComparator(a: GridLayoutItem, b: GridLayoutItem) {
  if (a.y !== b.y) {
    return a.y > b.y ? 1 : -1;
  }
  return a.x > b.x ? 1 : -1;
}
