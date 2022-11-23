// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { toString as engineToString } from "../../internal/debug-tools";
import { CommittedMove, LayoutShift } from "../../internal/dnd-engine/interfaces";
import { GridLayout, ItemId } from "../../internal/interfaces";
import { Position, Rect } from "../../internal/interfaces";

const GAP = 16;

export function printLayoutDebug(grid: GridLayout, layoutShift: LayoutShift) {
  // Logs for dnd-engine debugging.
  console.log("Grid before move:");
  console.log(engineToString(grid));

  console.log("Grid after move:");
  console.log(engineToString(layoutShift.next));

  console.log("Grid transition:");
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

export function appendPath(prevPath: Position[], collisionRect: Rect): Position[] {
  let safetyCounter = 0;
  const path: Array<Position> = [...prevPath];
  const lastPosition = prevPath[prevPath.length - 1];

  const vx = Math.sign(collisionRect.left - lastPosition.x);
  const vy = Math.sign(collisionRect.top - lastPosition.y);

  let { x, y } = lastPosition;

  while (x !== collisionRect.left || y !== collisionRect.top) {
    safetyCounter++;
    if (safetyCounter > 100) {
      throw new Error("infinite loop?");
    }
    if (x !== collisionRect.left) {
      x += vx;
      path.push({ x, y });
    }
    if (y !== collisionRect.top) {
      y += vy;
      path.push({ x, y });
    }
  }

  return path;
}
