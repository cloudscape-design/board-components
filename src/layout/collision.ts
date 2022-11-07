// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CollisionDetection, ClientRect } from "@dnd-kit/core";

function withinBounds(rect: ClientRect, [top, left, right, bottom]: readonly [number, number, number, number]) {
  return rect.top <= top && rect.left >= left && rect.right <= right && rect.bottom >= bottom;
}

function getMinDistance(min: number, current: number, collision: number) {
  const minDistance = Math.abs(min - collision);
  const currentDistance = Math.abs(current - collision);
  return currentDistance < minDistance ? current : min;
}

export const irregularRectIntersection: CollisionDetection = ({
  droppableRects,
  droppableContainers,
  collisionRect,
  active,
}) => {
  let bounds = [
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  ] as const;

  // snap current collision to rects grid
  for (const rect of droppableRects.values()) {
    bounds = [
      getMinDistance(bounds[0], rect.top, collisionRect.top),
      getMinDistance(bounds[1], rect.left, collisionRect.left),
      getMinDistance(bounds[2], rect.right, collisionRect.right),
      getMinDistance(bounds[3], rect.bottom, collisionRect.bottom),
    ];
  }

  // return all rects inside adjusted collision box
  return droppableContainers
    .filter((container) => container.id !== active.id && withinBounds(droppableRects.get(container.id)!, bounds))
    .map((container) => ({ id: container.id, data: { value: 1, droppableContainers } }));
  // TODO: handle scenario when widget is too small to cover any other
};
