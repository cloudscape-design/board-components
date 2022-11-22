// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { DragAndDropData } from "../../internal/dnd";
import { Rect } from "./interfaces";

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

function collisionsToRect(collisions: Array<GridLayoutItem>): Rect {
  return collisions.reduce(
    (rect, collision) => ({
      top: Math.min(rect.top, collision.y),
      left: Math.min(rect.left, collision.x),
      bottom: Math.max(rect.bottom, collision.y + collision.height),
      right: Math.max(rect.right, collision.x + collision.width),
    }),
    {
      top: Number.POSITIVE_INFINITY,
      left: Number.POSITIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
    }
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
    // TODO: should we cache getBoundingClientRect() somewhewre?
    const rect = droppableElement.getBoundingClientRect();
    bounds = {
      top: getMinDistance(bounds.top, rect.top, collisionRect.top),
      left: getMinDistance(bounds.left, rect.left, collisionRect.left),
      right: getMinDistance(bounds.right, rect.right, collisionRect.right),
      bottom: getMinDistance(bounds.bottom, rect.bottom, collisionRect.bottom),
    };
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

export function getHoveredDroppables({ containerRef, coordinates, droppables, resize }: DragAndDropData) {
  const activeRect = containerRef.current!.getBoundingClientRect();
  const collisionRect = resize
    ? {
        top: activeRect.top,
        left: activeRect.left,
        right: coordinates.x,
        bottom: coordinates.y,
      }
    : activeRect;
  return getCollisions(collisionRect, droppables);
}

export function getHoveredRect(collisionsIds: ReadonlyArray<string>, placeholders: ReadonlyArray<GridLayoutItem>) {
  const hoveredPlaceholders = collisionsIds.map((id) => placeholders.find((p) => p.id === id)!);
  return collisionsToRect(hoveredPlaceholders);
}
