// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_COLUMN_SPAN, MIN_ROW_SPAN } from "../constants";
import { BoardItemDefinition, BoardItemDefinitionBase, GridLayout, GridLayoutItem, ItemId } from "../interfaces";
import { LayoutShift } from "../layout-engine/interfaces";

/**
 * The function converts board items to grid items by assigning specific coordinates and sizes.
 * The relative item values are converted to absolute values that satisfy the given layout size.
 *
 * This function is the opposite of `exportItemsLayout`.
 */
export function createItemsLayout(items: readonly BoardItemDefinition<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const columnHeights = Array(columns).fill(0);

  function getItemWidth(item: BoardItemDefinition<unknown>) {
    return Math.round((Math.max(getMinItemColumnSpan(item), item.columnSpan) * columns) / 100) || MIN_COLUMN_SPAN;
  }
  function getItemHeight(item: BoardItemDefinition<unknown>) {
    return Math.max(getMinItemRowSpan(item), item.rowSpan);
  }
  function getItemOffset(item: BoardItemDefinition<unknown>) {
    return Math.round((item.columnOffset * columns) / 100);
  }

  let currentX = 0;
  for (const item of items) {
    const width = getItemWidth(item);
    const height = getItemHeight(item);

    // Increase current X by item's offset.
    currentX = currentX + getItemOffset(item);

    // Check if the current X fits in the row.
    currentX = currentX <= columns ? currentX : currentX - columns;

    // Check if the item fits in the row if placed to the current X.
    currentX = currentX + width <= columns ? currentX : 0;

    const nextX = Math.min(columns, currentX + width);

    // Obtain Y as the max column height underneath the item.
    let currentY = 0;
    for (let x = currentX; x < nextX; x++) {
      currentY = Math.max(currentY, columnHeights[x]);
    }

    layoutItems.push({ id: item.id, x: currentX, y: currentY, width, height });

    // Update column heights with the new item.
    for (let x = currentX; x < nextX; x++) {
      columnHeights[x] = currentY + height;
    }

    currentX = nextX;
  }

  layoutItems.sort(itemComparator);

  return { items: layoutItems, columns, rows: Math.max(...columnHeights) };
}

/**
 * Takes items and layout shift to produce updated items. The absolute item values for the given layout size
 * are converted to relative values that can scale to other layout sizes.
 *
 * This function is the opposite of `createItemsLayout`.
 */
export function exportItemsLayout<D>(
  sourceItems: readonly BoardItemDefinition<D>[],
  layoutShift: LayoutShift
): readonly BoardItemDefinition<D>[] {
  // No changes are needed when no moves were made.
  if (layoutShift.moves.length === 0) {
    return sourceItems as BoardItemDefinition<D>[];
  }

  const itemById = new Map(sourceItems.map((item) => [item.id, item]));
  function getItem(itemId: ItemId) {
    const item = itemById.get(itemId);
    if (!item) {
      throw new Error("Invariant violation: no matching source item found.");
    }
    return item;
  }

  const resizeTarget = (() => {
    const resizeMove = layoutShift.moves.find((m) => m.type === "RESIZE") ?? null;
    const originalItem = layoutShift.current.items.find((it) => it.id === resizeMove?.itemId)!;
    return resizeMove && originalItem.width !== resizeMove.width ? resizeMove.itemId : null;
  })();

  function getColumnSpan(width: number) {
    return (width / columns) * 100;
  }

  function getColumnOffset(distance: number) {
    return (((columns + distance) % columns) / columns) * 100;
  }

  const columns = layoutShift.next.columns;
  const sortedLayout = layoutShift.next.items.slice().sort(itemComparator);
  const boardItems: BoardItemDefinition<D>[] = [];

  let lastItemColumnOffset = 0;
  for (const layoutItem of sortedLayout) {
    const item = getItem(layoutItem.id);
    // The heights remain the same for every layout size so no conditions is needed.
    const rowSpan = layoutItem.height;
    // The widths of the items are relative and change based on the layout size.
    // To keep the updates minimal we only update width for the item that has been re-sized by the user.
    const columnSpan = item.id === resizeTarget ? getColumnSpan(layoutItem.width) : item.columnSpan;
    // All columns offsets are re-calculated with respect to the current layout size.
    // The offsets are converted to percentages to be better scalable between different sizes.
    const columnOffset = getColumnOffset(layoutItem.x - lastItemColumnOffset);

    boardItems.push({ ...item, columnOffset, columnSpan, rowSpan });

    lastItemColumnOffset = (layoutItem.x + layoutItem.width) % columns;
  }

  return boardItems;
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

export function getMinItemColumnSpan(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(0, item.definition?.minColumnSpan ?? 0);
}

export function getDefaultItemColumnSpan(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(getMinItemColumnSpan(item), item.definition?.defaultColumnSpan ?? 0);
}

export function getMinItemColumns(item: BoardItemDefinitionBase<unknown>, columns: number) {
  return Math.round((getMinItemColumnSpan(item) * columns) / 100) || MIN_COLUMN_SPAN;
}

export function getMinItemRowSpan(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(MIN_ROW_SPAN, item.definition?.minRows ?? MIN_ROW_SPAN);
}

export function getDefaultItemColumns(item: BoardItemDefinitionBase<unknown>, columns: number) {
  return Math.round((getDefaultItemColumnSpan(item) * columns) / 100) || MIN_COLUMN_SPAN;
}

export function getDefaultItemRowSpan(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(getMinItemRowSpan(item), item.definition?.defaultRows ?? MIN_ROW_SPAN);
}

function itemComparator(a: GridLayoutItem, b: GridLayoutItem) {
  if (a.y !== b.y) {
    return a.y > b.y ? 1 : -1;
  }
  return a.x > b.x ? 1 : -1;
}
