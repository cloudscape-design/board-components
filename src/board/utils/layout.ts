// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction } from "../../internal/interfaces";
import { LayoutEngine } from "../../internal/layout-engine/engine";
import { Coordinates } from "../../internal/utils/coordinates";
import { createPlaceholdersLayout, getDefaultItemSize } from "../../internal/utils/layout";
import { Position } from "../../internal/utils/position";
import { Transition } from "../interfaces";
import { normalizeInsertionPath } from "./path";

export function getItemWidth<D>(transition: Transition<D>) {
  return Math.min(transition.itemsLayout.columns, getDefaultItemSize(transition.draggableItem).width);
}

export function getItemHeight<D>(transition: Transition<D>) {
  return getDefaultItemSize(transition.draggableItem).height;
}

export function getLayoutColumns<D>(transition: Transition<D>) {
  return transition.itemsLayout.columns;
}

// The rows can be overridden during transition to create more drop targets at the bottom.
export function getLayoutRows<D>(transition: Transition<D>) {
  const layout = transition.layoutShift?.next ?? transition.itemsLayout;

  const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
  const itemHeight = layoutItem?.height ?? getItemHeight(transition);
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

export function getLayoutShift<D>(
  transition: Transition<D>,
  path: readonly Position[],
  insertionDirection?: Direction
) {
  if (path.length === 0) {
    return { layoutShift: null, layoutShiftWithRefloat: null };
  }

  let engine = new LayoutEngine(transition.itemsLayout);
  const width = getItemWidth(transition);
  const height = getItemHeight(transition);
  const rows = getLayoutRows(transition);
  const columns = getLayoutColumns(transition);

  switch (transition.operation) {
    case "resize":
      engine = engine.resize({ itemId: transition.draggableItem.id, path });
      break;
    case "reorder":
      engine = engine.move({ itemId: transition.draggableItem.id, path });
      break;
    case "insert":
      engine = engine.insert({
        itemId: transition.draggableItem.id,
        width,
        height,
        path: normalizeInsertionPath(path, insertionDirection ?? "right", columns, rows),
      });
      break;
  }

  return { layoutShift: engine.getLayoutShift(), layoutShiftWithRefloat: engine.refloat().getLayoutShift() };
}
