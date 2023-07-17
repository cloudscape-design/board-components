// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction } from "../../internal/interfaces";
import { LayoutShift } from "../../internal/layout-engine/interfaces";
import { Coordinates } from "../../internal/utils/coordinates";
import { createPlaceholdersLayout, getDefaultColumnSpan, getDefaultRowSpan } from "../../internal/utils/layout";
import { Position } from "../../internal/utils/position";
import { Transition } from "../interfaces";
import { normalizeInsertionPath } from "./path";

export function getLayoutColumns<D>(transition: Transition<D>) {
  return transition.itemsLayout.columns;
}

// The rows can be overridden during transition to create more drop targets at the bottom.
export function getLayoutRows<D>(transition: Transition<D>) {
  const layout = transition.layoutShift?.next ?? transition.itemsLayout;

  const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
  const itemHeight = layoutItem?.height ?? getDefaultRowSpan(transition.draggableItem);
  // Add extra row for resize when already at the bottom.
  if (transition.operation === "resize") {
    return Math.max(layout.rows, layoutItem ? layoutItem.y + layoutItem.height + 1 : 0);
  }
  // Add extra row(s) for reorder/insert based on item's height.
  else {
    return Math.max(layout.rows, transition.itemsLayout.rows + itemHeight);
  }
}

export function getLayoutPlaceholders<D>(transition: Transition<D>) {
  const rows = getLayoutRows(transition);
  const columns = getLayoutColumns(transition);
  return createPlaceholdersLayout(rows, columns);
}

/**
 * Retrieves direction from where the inserting item comes.
 */
export function getInsertionDirection(cursorOffset: Coordinates): Direction {
  if (cursorOffset.x < 0) {
    return "right";
  }
  if (cursorOffset.x > 0) {
    return "left";
  }
  if (cursorOffset.y < 0) {
    return "down";
  }
  if (cursorOffset.y > 0) {
    return "up";
  }
  return "right";
}

/**
 * Applies transition operation (reorder/move/insert) and retrieves an object that describes the updated
 * layout and the moves to be made including and not including items float to top.
 *
 * The layout shift w/o refloat is used for rendering and w/ refloat is used for live announcements.
 */
export function getLayoutShift<D>(
  transition: Transition<D>,
  path: readonly Position[],
  insertionDirection?: Direction
): null | LayoutShift {
  if (path.length === 0) {
    return null;
  }

  const width = getDefaultColumnSpan(transition.draggableItem, getLayoutColumns(transition));
  const height = getDefaultRowSpan(transition.draggableItem);
  const rows = getLayoutRows(transition);
  const columns = getLayoutColumns(transition);

  switch (transition.operation) {
    case "resize":
      return transition.layoutEngine.resize({ itemId: transition.draggableItem.id, path }).getLayoutShift();
    case "reorder":
      return transition.layoutEngine.move({ itemId: transition.draggableItem.id, path }).getLayoutShift();
    case "insert":
      return transition.layoutEngine
        .insert({
          itemId: transition.draggableItem.id,
          width,
          height,
          path: normalizeInsertionPath(path, insertionDirection ?? "right", columns, rows),
        })
        .getLayoutShift();
  }
}
