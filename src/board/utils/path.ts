// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Direction } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { Position } from "../../internal/utils/position";

/**
 * The insertion operation is similar to reorder yet the first path entry is treated differently.
 * The normalization removes leading path entries if on the same edge to optimize UX.
 */
export function normalizeInsertionPath(
  path: readonly Position[],
  insertionDirection: Direction,
  columns: number,
  rows: number,
): Position[] {
  let edgeIndex = -1;
  for (let i = 0; i < path.length; i++) {
    switch (insertionDirection) {
      case "left": {
        if (path[i].x === 0) {
          edgeIndex = i;
        }
        break;
      }
      case "right": {
        if (path[i].x === columns - 1) {
          edgeIndex = i;
        }
        break;
      }
      case "up": {
        if (path[i].y === 0) {
          edgeIndex = i;
        }
        break;
      }
      case "down": {
        if (path[i].y === rows - 1) {
          edgeIndex = i;
        }
        break;
      }
    }
  }
  return path.slice(edgeIndex);
}

export function appendMovePath(prevPath: readonly Position[], collisionRect: Rect): Position[] {
  return appendPath(prevPath, new Position({ x: collisionRect.left, y: collisionRect.top }));
}

export function appendResizePath(prevPath: readonly Position[], collisionRect: Rect): Position[] {
  return appendPath(prevPath, new Position({ x: collisionRect.right, y: collisionRect.bottom }));
}

/**
 * The operation path must be strictly incremental (each dx + dy == 1). However, the actual collisions
 * data can have gaps due to pointer events throttling or other factors.
 *
 * The function produces next path from previous path and the target position by incrementally adding steps.
 */
function appendPath(prevPath: readonly Position[], nextPosition: Position): Position[] {
  const path: Array<Position> = [...prevPath];
  const lastPosition = prevPath[prevPath.length - 1];

  if (!lastPosition) {
    return [nextPosition];
  }

  const vx = Math.sign(nextPosition.x - lastPosition.x);
  const vy = Math.sign(nextPosition.y - lastPosition.y);

  let { x, y } = lastPosition;
  let safetyCounter = 0;

  while (x !== nextPosition.x || y !== nextPosition.y) {
    if (++safetyCounter === 100) {
      throw new Error("Invariant violation: infinite loop in appendPath.");
    }
    if (x !== nextPosition.x) {
      x += vx;
    } else {
      y += vy;
    }
    path.push(new Position({ x, y }));
  }

  return path;
}
