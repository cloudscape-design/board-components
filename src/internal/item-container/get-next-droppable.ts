// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Droppable } from "../dnd-controller/controller";
import { Direction, ItemId } from "../interfaces";
import { getClosestNeighbor } from "../utils/rects";
import { getNormalizedElementRect } from "../utils/screen";

/**
 * Finds closest droppable to provided draggable element and direction.
 * Returns null if there is no droppable in the given direction.
 */
export function getNextDroppable({
  draggableElement,
  droppables,
  direction,
  isRtl,
}: {
  draggableElement: HTMLElement;
  droppables: readonly [ItemId, Droppable][];
  direction: Direction;
  isRtl: boolean;
}): null | ItemId {
  const draggableRect = getNormalizedElementRect(draggableElement);
  const sources = new Map(droppables.map(([id, d]) => [getNormalizedElementRect(d.element), id]));
  const closest = getClosestNeighbor({
    target: draggableRect,
    sources: [...sources.keys()],
    direction,
    isRtl,
  });
  return sources.get(closest as DOMRect) ?? null;
}
