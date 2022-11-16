// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { isInsideRect } from "./utils";

function getMinDistance(min: number, current: number, collision: number) {
  const minDistance = Math.abs(min - collision);
  const currentDistance = Math.abs(current - collision);
  return currentDistance < minDistance ? current : min;
}

/**
 * Finds all containers covered by the current draggable item. Built-in algorithms from dnd-kit do not support irregular
 * sizes of containers, where a container may fully cover multiple droppable spots.
 * More details on dnd-kit API: https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms
 */
export const getCollisions = (
  active: HTMLElement,
  droppables: Set<HTMLElement>,
  droppableIds: WeakMap<HTMLElement, string>
) => {
  const collisionRect = active.getBoundingClientRect();
  let bounds = {
    top: Number.POSITIVE_INFINITY,
    left: Number.POSITIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    bottom: Number.POSITIVE_INFINITY,
  };

  // snap current collision to rects grid
  for (const droppable of droppables.values()) {
    const rect = droppable.getBoundingClientRect();
    bounds = {
      top: getMinDistance(bounds.top, rect.top, collisionRect.top),
      left: getMinDistance(bounds.left, rect.left, collisionRect.left),
      right: getMinDistance(bounds.right, rect.right, collisionRect.right),
      bottom: getMinDistance(bounds.bottom, rect.bottom, collisionRect.bottom),
    };
  }
  // make sure collision always fits into the grid
  const { width, height } = collisionRect;
  if (bounds.bottom - bounds.top < height) {
    bounds.top = bounds.bottom - height;
  }
  if (bounds.right - bounds.left < width) {
    bounds.left = bounds.right - width;
  }
  // make sure collision sticks to the bottom of the current layout
  // TODO: decide on this feature
  // if (bubbleUp) {
  //   const nodes: DndContextDescriptor["draggableNodes"] = active.data.current!.draggableNodes;
  //   const maxBottom =
  //     [...nodes.values()]
  //       .filter((node) => node && node!.id !== active.id)
  //       .map((node) => node!.node.current!.getBoundingClientRect())
  //       .filter((rect) => rect.right > bounds.left && rect.left < bounds.right)
  //       .reduce((maxBottom, rect) => Math.max(maxBottom, rect.bottom), 0) + 16;
  //   if (bounds.bottom > maxBottom + height) {
  //     bounds.top = maxBottom;
  //     bounds.bottom = maxBottom + height;
  //   }
  // }

  // return all rects inside adjusted collision box
  return [...droppables]
    .filter((droppable) => isInsideRect(droppable.getBoundingClientRect(), bounds))
    .map((droppable) => droppableIds.get(droppable)!);
};
