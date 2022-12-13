// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Droppable } from "../dnd-controller/controller";
import { Direction, ItemId } from "../interfaces";
import { getClosestNeighbour } from "../utils/rects";

export function getNextDroppable(
  draggableElement: HTMLElement,
  droppables: readonly [ItemId, Droppable][],
  direction: Direction
): null | Droppable {
  const draggableRect = draggableElement.getBoundingClientRect();
  const sources = new Map(droppables.map(([, d]) => [d.element.getBoundingClientRect(), d]));
  const closest = getClosestNeighbour(draggableRect, [...sources.keys()], direction);
  return sources.get(closest as DOMRect) ?? null;
}
