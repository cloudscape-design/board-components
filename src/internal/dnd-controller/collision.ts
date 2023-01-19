// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ItemId } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { Coordinates } from "../utils/coordinates";
import { getGridPlacement, isInside } from "../utils/rects";
import { getNormalizedElementRect } from "../utils/screen";
import { Operation } from "./controller";

/**
 * Produces a rect (in coordinates) to represent the draggable item.
 */
export function getCollisionRect(operation: Operation, draggableElement: HTMLElement, coordinates: Coordinates) {
  const activeRect = getNormalizedElementRect(draggableElement);

  let collisionRect = { left: 0, top: 0, right: 0, bottom: 0 };

  if (operation === "reorder") {
    collisionRect = activeRect;
  }
  if (operation === "resize") {
    collisionRect = { left: activeRect.left, top: activeRect.top, right: coordinates.x, bottom: coordinates.y };
  }
  if (operation === "insert") {
    collisionRect = {
      left: coordinates.x,
      top: coordinates.y,
      right: coordinates.x + activeRect.width,
      bottom: coordinates.y + activeRect.height,
    };
  }

  return collisionRect;
}

/**
 * Returns IDs of droppables hovered by the draggable rect.
 */
export function getHoveredDroppables(collisionRect: Rect, droppables: readonly [ItemId, HTMLElement][]) {
  const droppableRects = droppables.map(([, element]) => getNormalizedElementRect(element));
  const bounds = getGridPlacement(collisionRect, droppableRects);
  return droppables.filter((_, index) => isInside(droppableRects[index], bounds)).map(([droppableId]) => droppableId);
}
