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
  currentColumns: number,
  targetColumns: number
): readonly BoardItemDefinition<D>[] {
  // No changes are needed when no moves are committed.
  if (layoutShift.moves.length === 0) {
    return sourceItems as BoardItemDefinition<D>[];
  }

  const itemById = new Map(sourceItems.map((item, index) => [item.id, { index, item }]));
  const getItem = (itemId: ItemId) => {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  };

  const sortedLayout = layoutShift.next.items.slice().sort(itemComparator);
  const resizeTarget = getResizeTarget(layoutShift);
  const colAffordance = Array(COLUMNS_DEFAULT * 2).fill(0);
  const boardItems: BoardItemDefinition<D>[] = [];

  function getColumnSpan(item: BoardItemDefinitionBase<D> | BoardItemDefinition<D>) {
    return "columnSpan" in item ? item.columnSpan : getDefaultItemSize(item).width;
  }

  function getColumnOffset(item: BoardItemDefinitionBase<D> | BoardItemDefinition<D>) {
    return "columnOffset" in item ? item.columnOffset : 0;
  }

  function findNextColumnOffset(currentColumnOffset: number, columnSpan: number, rowSpan: number): number {
    const maxRowOffset = Math.max(...colAffordance);

    for (
      let attemptedColumnOffset = currentColumnOffset;
      attemptedColumnOffset <= targetColumns - columnSpan;
      attemptedColumnOffset++
    ) {
      let attemptedMaxRowOffset = 0;
      for (let spanIndex = 0; spanIndex < columnSpan; spanIndex++) {
        attemptedMaxRowOffset = Math.max(
          attemptedMaxRowOffset,
          colAffordance[attemptedColumnOffset + spanIndex] + rowSpan
        );
      }
      if (attemptedMaxRowOffset <= maxRowOffset) {
        return attemptedColumnOffset;
      }
    }

    return currentColumnOffset + columnSpan <= targetColumns ? currentColumnOffset : 0;
  }

  // Translate layout shift result to the items directly if current layout matches target layout.
  if (currentColumns === targetColumns) {
    for (const { id, x, width, height } of sortedLayout) {
      boardItems.push({ ...getItem(id).item, columnOffset: x, columnSpan: width, rowSpan: height });
    }
  }
  // Otherwise - re-create target layout maintaining item indices when possible.
  else {
    let currentColumnOffset = 0;
    let keepOriginalOffset = true;

    for (let index = 0; index < sortedLayout.length; index++) {
      const { id, height: rowSpan, width } = sortedLayout[index];
      const { index: originalIndex, item } = getItem(id);

      // Column span is only updated when the item width has been changed.
      const columnSpan =
        item.id === resizeTarget ? Math.round(width * (targetColumns / currentColumns)) : getColumnSpan(item);

      // Can't preserve original item locations after the first discrepancy.
      if (index !== originalIndex) {
        keepOriginalOffset = false;
      }

      // Use original column offset or find the best alternative offset to keep the order and reduce the gaps.
      const columnOffset = keepOriginalOffset
        ? getColumnOffset(item)
        : findNextColumnOffset(currentColumnOffset, columnSpan, rowSpan);
      currentColumnOffset = columnOffset + columnSpan < targetColumns ? columnOffset + columnSpan : 0;

      for (let columnIndex = columnOffset; columnIndex < columnOffset + columnSpan; columnIndex++) {
        colAffordance[columnIndex] += rowSpan;
      }

      // Resized item can keep its original offset but the following items need to adapt.
      if (item.id === resizeTarget) {
        keepOriginalOffset = false;
      }

      boardItems.push({ ...item, columnOffset, columnSpan, rowSpan });
    }
  }

  return boardItems;
}

/**
 * Returns ID of an item which width has been changed or null of no such item exists.
 */
function getResizeTarget(layoutShift: LayoutShift): null | ItemId {
  const resizeTarget = layoutShift.moves.find((m) => m.type === "RESIZE") ?? null;
  if (!resizeTarget) {
    return null;
  }
  const originalItem = layoutShift.current.items.find((it) => it.id === resizeTarget.itemId)!;
  return originalItem.width !== resizeTarget.width ? resizeTarget.itemId : null;
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
