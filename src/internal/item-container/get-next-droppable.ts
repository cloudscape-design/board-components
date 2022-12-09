// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Droppable } from "../dnd-controller/controller";
import { Direction, ItemId, Rect } from "../interfaces";
import { getClosestNeighbour } from "../utils/rects";

export function getNextDroppable(
  draggableElement: HTMLElement,
  droppables: readonly [ItemId, Droppable][],
  direction: Direction
): null | Rect {
  const draggableRect = draggableElement.getBoundingClientRect();
  const sources = droppables.map(([, { element }]) => element.getBoundingClientRect());
  return getClosestNeighbour(draggableRect, sources, direction);
}
