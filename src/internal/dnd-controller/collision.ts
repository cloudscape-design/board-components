// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Coordinates, ItemId } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { isIntersecting } from "../utils/geometry";

function getMinDistance(min: number, current: number, collision: number) {
  const minDistance = Math.abs(min - collision);
  const currentDistance = Math.abs(current - collision);
  return currentDistance < minDistance ? current : min;
}

function isInsideRect(rect: Rect, bounds: Rect) {
  return (
    rect.top >= bounds.top && rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom
  );
}

const getCollisions = (collisionRect: Rect, droppables: readonly [string, HTMLElement][]) => {
  let bounds = {
    top: Number.POSITIVE_INFINITY,
    left: Number.POSITIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    bottom: Number.POSITIVE_INFINITY,
  };

  // snap current collision to rects grid
  for (const [, droppableElement] of droppables) {
    const droppableRect = droppableElement.getBoundingClientRect();
    if (isIntersecting(droppableRect, collisionRect)) {
      bounds = {
        top: getMinDistance(bounds.top, droppableRect.top, collisionRect.top),
        left: getMinDistance(bounds.left, droppableRect.left, collisionRect.left),
        right: getMinDistance(bounds.right, droppableRect.right, collisionRect.right),
        bottom: getMinDistance(bounds.bottom, droppableRect.bottom, collisionRect.bottom),
      };
    }
  }

  // make sure collision always fits into the grid
  const width = collisionRect.right - collisionRect.left;
  const height = collisionRect.bottom - collisionRect.top;
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

export function getHoveredDroppables(
  operation: "move" | "resize",
  draggableElement: HTMLElement,
  coordinates: Coordinates,
  droppables: readonly [ItemId, HTMLElement][]
) {
  const activeRect = draggableElement.getBoundingClientRect();
  const collisionRect =
    operation === "resize"
      ? { top: activeRect.top, left: activeRect.left, right: coordinates.x, bottom: coordinates.y }
      : activeRect;
  return getCollisions(collisionRect, droppables);
}
