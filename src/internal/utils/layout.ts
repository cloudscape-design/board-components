// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { COLUMNS_DEFAULT, COLUMNS_M, COLUMNS_XS, MIN_ROWS, MIN_WIDTH } from "../constants";
import { BoardItemDefinition, BoardItemDefinitionBase, GridLayout, GridLayoutItem, ItemId } from "../interfaces";
import { LayoutShift } from "../layout-engine/interfaces";

export function createItemsLayout(items: readonly BoardItemDefinition<unknown>[], columns: number): GridLayout {
  const layoutItems: GridLayoutItem[] = [];
  const colAffordance = Array(COLUMNS_DEFAULT * 2).fill(-1);

  let itemColumnOffset = 0;
  for (const item of items) {
    const itemColumnSpan = Math.round(Math.max(getMinItemWidth(item), item.width) * columns) || 1;
    const itemRowSpan = Math.max(getMinItemRows(item), item.rows);

    // Increase current offset by item's offset.
    itemColumnOffset = itemColumnOffset + Math.round(item.offset * columns);

    // Reset current offset to 0 if the item can't fit into the current row.
    itemColumnOffset = itemColumnOffset + itemColumnSpan <= columns ? itemColumnOffset : itemColumnOffset % columns;

    let itemRowOffset = 0;
    for (let col = itemColumnOffset; col < itemColumnOffset + itemColumnSpan; col++) {
      itemRowOffset = Math.max(itemRowOffset, colAffordance[col] + 1);
    }

    layoutItems.push({
      id: item.id,
      width: itemColumnSpan,
      height: itemRowSpan,
      x: itemColumnOffset,
      y: itemRowOffset,
    });

    for (let col = itemColumnOffset; col < itemColumnOffset + itemColumnSpan; col++) {
      colAffordance[col] = itemRowOffset + itemRowSpan - 1;
    }

    // Increase current offset by inserted item's column span.
    itemColumnOffset = itemColumnOffset + itemColumnSpan;
  }

  const rows = Math.max(...colAffordance) + 1;

  layoutItems.sort(itemComparator);

  // console.log("createItemsLayout", { items, layoutItems });

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
  sourceItems: readonly (BoardItemDefinitionBase<D> | BoardItemDefinition<D>)[]
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

  const columns = layoutShift.next.columns;
  const sortedLayout = layoutShift.next.items.slice().sort(itemComparator);
  const resizeTarget = getResizeTarget(layoutShift);
  const boardItems: BoardItemDefinition<D>[] = [];

  function getItemWidth(item: BoardItemDefinitionBase<D> | BoardItemDefinition<D>) {
    return "width" in item ? item.width : getDefaultItemWidth(item);
  }

  // TODO: keep offsets unchanged for those items that stayed untouched (by indices)
  let lastItemColumnOffset = 0;
  for (const layoutItem of sortedLayout) {
    const item = getItem(layoutItem.id);
    const rows = layoutItem.height;
    const width = item.id === resizeTarget ? layoutItem.width / columns : getItemWidth(item);
    const offset = ((columns + layoutItem.x - lastItemColumnOffset) % columns) / columns;

    boardItems.push({ ...item, offset, width, rows });

    lastItemColumnOffset = (layoutItem.x + layoutItem.width) % columns;
  }

  // console.log("exportItemsLayout", { items: boardItems, layoutItems: layoutShift.next });

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

export function getMinItemWidth(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(MIN_WIDTH, item.definition?.minWidth ?? MIN_WIDTH);
}

export function getMinItemColumns(item: BoardItemDefinitionBase<unknown>, columns: number) {
  return Math.round(getMinItemWidth(item) * columns);
}

export function getMinItemRows(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(MIN_ROWS, item.definition?.minRows ?? MIN_ROWS);
}

export function getDefaultItemWidth(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(getMinItemWidth(item), item.definition?.defaultWidth ?? MIN_WIDTH);
}

export function getDefaultItemColumns(item: BoardItemDefinitionBase<unknown>, columns: number) {
  return Math.round(getDefaultItemWidth(item) * columns);
}

export function getDefaultItemRows(item: BoardItemDefinitionBase<unknown>) {
  return Math.max(getMinItemRows(item), item.definition?.defaultRows ?? MIN_ROWS);
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
