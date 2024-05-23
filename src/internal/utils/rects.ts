// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, Rect } from "../interfaces";

export function isInside(rect: Rect, bounds: Rect) {
  return (
    rect.top >= bounds.top && rect.left >= bounds.left && rect.right <= bounds.right && rect.bottom <= bounds.bottom
  );
}

export function isIntersecting(rect1: Rect, rect2: Rect) {
  return getIntersectionArea(rect1, rect2) > 0;
}

export function getIntersectionArea(rect1: Rect, rect2: Rect) {
  let horizontalIntersectionLength = 0;
  if (rect2.left <= rect1.left && rect1.left <= rect2.right) {
    horizontalIntersectionLength = Math.min(rect1.right, rect2.right) - rect1.left;
  } else if (rect2.left <= rect1.right && rect1.right <= rect2.right) {
    horizontalIntersectionLength = rect1.right - Math.max(rect1.left, rect2.left);
  } else if (rect1.left <= rect2.left && rect2.left <= rect1.right) {
    horizontalIntersectionLength = Math.min(rect1.right, rect2.right) - rect2.left;
  } else if (rect1.left <= rect2.right && rect2.right <= rect1.right) {
    horizontalIntersectionLength = rect2.right - Math.max(rect1.left, rect2.left);
  }

  let verticalIntersectionLength = 0;
  if (rect2.top <= rect1.top && rect1.top <= rect2.bottom) {
    verticalIntersectionLength = Math.min(rect1.bottom, rect2.bottom) - rect1.top;
  } else if (rect2.top <= rect1.bottom && rect1.bottom <= rect2.bottom) {
    verticalIntersectionLength = rect1.bottom - Math.max(rect1.top, rect2.top);
  } else if (rect1.top <= rect2.top && rect2.top <= rect1.bottom) {
    verticalIntersectionLength = Math.min(rect1.bottom, rect2.bottom) - rect2.top;
  } else if (rect1.top <= rect2.bottom && rect2.bottom <= rect1.bottom) {
    verticalIntersectionLength = rect2.bottom - Math.max(rect1.top, rect2.top);
  }

  return horizontalIntersectionLength * verticalIntersectionLength;
}

export function getGridPlacement(target: Rect, grid: readonly Rect[]): Rect {
  function getMinDistance(min: number, current: number, collision: number) {
    const minDistance = Math.abs(min - collision);
    const currentDistance = Math.abs(current - collision);
    return currentDistance < minDistance ? current : min;
  }

  let placement = {
    top: Number.POSITIVE_INFINITY,
    left: Number.POSITIVE_INFINITY,
    right: Number.POSITIVE_INFINITY,
    bottom: Number.POSITIVE_INFINITY,
  };

  for (const rect of grid) {
    if (isIntersecting(rect, target)) {
      placement = {
        top: getMinDistance(placement.top, rect.top, target.top),
        left: getMinDistance(placement.left, rect.left, target.left),
        right: getMinDistance(placement.right, rect.right, target.right),
        bottom: getMinDistance(placement.bottom, rect.bottom, target.bottom),
      };
    }
  }

  return placement;
}

export function getClosestNeighbor({
  target,
  sources,
  direction,
  isRtl,
}: {
  target: Rect;
  sources: readonly Rect[];
  direction: Direction;
  isRtl: boolean;
}): null | Rect {
  const getFirst = (rects: Rect[]) => rects[0] ?? null;
  const verticalDiff = (r1: Rect, r2: Rect) => Math.abs(r1.top - target.top) - Math.abs(r2.top - target.top);
  const horizontalDiff = (r1: Rect, r2: Rect) => Math.abs(r1.left - target.left) - Math.abs(r2.left - target.left);

  if (isRtl && direction === "left") {
    direction = "right";
  } else if (isRtl && direction === "right") {
    direction = "left";
  }

  switch (direction) {
    case "left":
      return getFirst(
        sources.filter((rect) => rect.right <= target.left).sort((r1, r2) => r2.left - r1.left || verticalDiff(r1, r2)),
      );
    case "right":
      return getFirst(
        sources.filter((rect) => rect.left >= target.right).sort((r1, r2) => r1.left - r2.left || verticalDiff(r1, r2)),
      );
    case "up":
      return getFirst(
        sources.filter((rect) => rect.bottom <= target.top).sort((r1, r2) => r2.top - r1.top || horizontalDiff(r1, r2)),
      );
    case "down":
      return getFirst(
        sources.filter((rect) => rect.top >= target.bottom).sort((r1, r2) => r1.top - r2.top || horizontalDiff(r1, r2)),
      );
  }
}
