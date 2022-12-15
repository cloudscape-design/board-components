// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Droppable } from "../dnd-controller/controller";
import { Direction, ItemId } from "../interfaces";
import { getClosestNeighbour } from "../utils/rects";
import { getNormalizedElementRect } from "../utils/screen";

export function getNextDroppable(
  draggableElement: HTMLElement,
  droppables: readonly [ItemId, Droppable][],
  direction: Direction
): null | Droppable {
  const draggableRect = getNormalizedElementRect(draggableElement);
  const sources = new Map(droppables.map(([, d]) => [getNormalizedElementRect(d.element), d]));
  const closest = getClosestNeighbour(draggableRect, [...sources.keys()], direction);
  return sources.get(closest as DOMRect) ?? null;
}
