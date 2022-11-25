// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { GAP } from "../../internal/constants";
import { toString as engineToString } from "../../internal/debug-tools";
import { GridLayout, ItemId } from "../../internal/interfaces";
import { Position, Rect } from "../../internal/interfaces";
import { CommittedMove, LayoutShift } from "../../internal/layout-engine/interfaces";

export function printLayoutDebug(grid: GridLayout, layoutShift: LayoutShift) {
  // Logs for layout-engine debugging.
  console.log("Grid before move:");
  console.log(engineToString(grid));

  console.log("Grid after move:");
  console.log(engineToString(layoutShift.next));

  console.log("Layout shift:");
  console.log(layoutShift);
}

export function createTransforms(
  grid: GridLayout,
  moves: readonly CommittedMove[],
  cell: { width: number; height: number }
) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.items.find((prev) => prev.id === move.itemId);

    // Item can be missing if inserting.
    if (item) {
      transforms[item.id] = {
        x: (move.x - item.x) * (cell.width + GAP),
        y: (move.y - item.y) * (cell.height + GAP),
        scaleX: 1,
        scaleY: 1,
      };
    }
  }

  return transforms;
}

export function appendPath(
  prevPath: Position[],
  collisionRect: Rect,
  columns: number,
  colspan: number,
  resize: boolean
): Position[] {
  if (
    !isFinite(collisionRect.top) ||
    !isFinite(collisionRect.bottom) ||
    !isFinite(collisionRect.left) ||
    !isFinite(collisionRect.right)
  ) {
    return prevPath;
  }

  const collisionX = resize ? collisionRect.right : collisionRect.left;
  const collisionY = resize ? collisionRect.bottom : collisionRect.top;

  const path: Array<Position> = [...prevPath];
  const lastPosition = prevPath[prevPath.length - 1];

  const nextX = Math.min(columns - colspan, collisionX);
  const nextY = collisionY;

  if (!lastPosition) {
    return [{ x: nextX, y: nextY }];
  }

  const vx = Math.sign(collisionX - lastPosition.x);
  const vy = Math.sign(collisionY - lastPosition.y);

  let { x, y } = lastPosition;
  let safetyCounter = 0;

  while (x !== nextX || y !== nextY) {
    if (++safetyCounter === 100) {
      throw new Error("Infinite loop in appendPath.");
    }
    if (x !== nextX) {
      x += vx;
    } else {
      y += vy;
    }
    path.push({ x, y });
  }

  return path;
}
