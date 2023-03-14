// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ItemId } from "../interfaces";
import { Rect } from "../interfaces";
import { getGridPlacement, isInside } from "../utils/rects";
import { getNormalizedElementRect } from "../utils/screen";

/**
 * Returns IDs of droppables hovered by the draggable rect.
 */
export function getHoveredDroppables(collisionRect: Rect, droppables: readonly [ItemId, HTMLElement][]) {
  const droppableRects = droppables.map(([, element]) => getNormalizedElementRect(element));
  const bounds = getGridPlacement(collisionRect, droppableRects);
  return droppables.filter((_, index) => isInside(droppableRects[index], bounds)).map(([droppableId]) => droppableId);
}
