// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Rect } from "./interfaces";

function getMinDistance(min: number, current: number, collision: number) {
  const minDistance = Math.abs(min - collision);
  const currentDistance = Math.abs(current - collision);
  return currentDistance < minDistance ? current : min;
}

function isInsideRect(rect: Rect, bounds: Rect) {
  return (
    rect.top <= bounds.top && rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom >= bounds.bottom
  );
}

/**
 * Finds all containers covered by the current draggable item. Built-in algorithms from dnd-kit do not support irregular
 * sizes of containers, where a container may fully cover multiple droppable spots.
 * More details on dnd-kit API: https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms
 */
export const getCollisions = (active: HTMLElement, droppables: readonly [string, HTMLElement][]) => {
  const collisionRect = active.getBoundingClientRect();
  let bounds = {
    top: Number.POSITIVE_INFINITY,
    left: Number.POSITIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    bottom: Number.POSITIVE_INFINITY,
  };

  // snap current collision to rects grid
  for (const [, droppableElement] of droppables) {
    const rect = droppableElement.getBoundingClientRect();
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

  // return all rects inside adjusted collision box
  return droppables
    .filter(([, droppableElement]) => isInsideRect(droppableElement.getBoundingClientRect(), bounds))
    .map(([droppableId]) => droppableId);
};
