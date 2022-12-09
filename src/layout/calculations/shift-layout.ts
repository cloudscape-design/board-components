// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { toString as engineToString } from "../../internal/debug-tools";
import { GridLayout, ItemId, Transform } from "../../internal/interfaces";
import { Rect } from "../../internal/interfaces";
import { CommittedMove, LayoutShift } from "../../internal/layout-engine/interfaces";
import { Position } from "../../internal/utils/position";

export function printLayoutDebug(grid: GridLayout, layoutShift: LayoutShift) {
  // Logs for layout-engine debugging.
  console.log("Grid before move:");
  console.log(engineToString(grid));

  console.log("Grid after move:");
  console.log(engineToString(layoutShift.next));

  console.log("Layout shift:");
  console.log(layoutShift);
}

export function createTransforms(grid: GridLayout, moves: readonly CommittedMove[]) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.items.find((prev) => prev.id === move.itemId);

    // Item can be missing if inserting.
    if (item) {
      transforms[item.id] = {
        x: move.x - item.x,
        y: move.y - item.y,
        width: move.width,
        height: move.height,
      };
    }
  }

  return transforms;
}

export function appendMovePath(prevPath: Position[], collisionRect: Rect): Position[] {
  return appendPath(prevPath, new Position({ x: collisionRect.left, y: collisionRect.top }));
}

export function appendResizePath(prevPath: Position[], collisionRect: Rect): Position[] {
  return appendPath(prevPath, new Position({ x: collisionRect.right, y: collisionRect.bottom }));
}

function appendPath(prevPath: Position[], nextPosition: Position): Position[] {
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
