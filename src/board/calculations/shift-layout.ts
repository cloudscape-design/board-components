// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Direction, GridLayout, ItemId, Transform } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { CommittedMove } from "../../internal/layout-engine/interfaces";
import { Position } from "../../internal/utils/position";

export function createTransforms(grid: GridLayout, moves: readonly CommittedMove[]) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.items.find((prev) => prev.id === move.itemId);

    if (move.type === "REMOVE") {
      transforms[move.itemId] = { type: "remove" };
    } else if (item) {
      transforms[item.id] = {
        type: "move",
        x: move.x - item.x,
        y: move.y - item.y,
        width: move.width,
        height: move.height,
      };
    }
  }

  return transforms;
}

export function normalizeInsertionPath(
  path: readonly Position[],
  insertionDirection: Direction,
  columns: number,
  rows: number
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
      throw new Error("Infinite loop in appendPath.");
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
