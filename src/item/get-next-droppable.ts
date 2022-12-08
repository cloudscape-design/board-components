// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Droppable } from "../internal/dnd-controller/pointer-controller";
import { Direction, ItemId } from "../internal/interfaces";

export function getNextDroppable(
  draggableElement: HTMLElement,
  droppables: readonly [ItemId, Droppable][],
  direction: Direction
) {
  const draggableRect = draggableElement.getBoundingClientRect();
  const rects = new Map<ItemId, DOMRect>(droppables.map(([id, { element }]) => [id, element.getBoundingClientRect()]));
  const rect = ([id]: [ItemId, Droppable]) => rects.get(id)!;

  switch (direction) {
    case "left":
      return (
        droppables
          .filter((d) => rect(d).right <= draggableRect.left)
          .sort(
            (d1, d2) =>
              rect(d2).x - rect(d1).x || Math.abs(rect(d1).y - draggableRect.y) - Math.abs(rect(d2).y - draggableRect.y)
          )[0] ?? null
      );
    case "right":
      return (
        droppables
          .filter((d) => rect(d).left >= draggableRect.right)
          .sort(
            (d1, d2) =>
              rect(d1).x - rect(d2).x || Math.abs(rect(d1).y - draggableRect.y) - Math.abs(rect(d2).y - draggableRect.y)
          )[0] ?? null
      );
    case "up":
      return (
        droppables
          .filter((d) => rect(d).bottom <= draggableRect.top)
          .sort(
            (d1, d2) =>
              rect(d2).y - rect(d1).y || Math.abs(rect(d1).x - draggableRect.x) - Math.abs(rect(d2).x - draggableRect.x)
          )[0] ?? null
      );
    case "down":
      return (
        droppables
          .filter((d) => rect(d).top >= draggableRect.bottom)
          .sort(
            (d1, d2) =>
              rect(d1).y - rect(d2).y || Math.abs(rect(d1).x - draggableRect.x) - Math.abs(rect(d2).x - draggableRect.x)
          )[0] ?? null
      );
  }
}
