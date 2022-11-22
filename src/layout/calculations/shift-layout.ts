// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { toString as engineToString } from "../../internal/debug-tools";
import { DndEngine } from "../../internal/dnd-engine/engine";
import { CommittedMove } from "../../internal/dnd-engine/interfaces";
import { GridLayout, ItemId } from "../../internal/interfaces";
import { Position, Rect } from "../../internal/interfaces";

const GAP = 16;

export function printLayoutDebug(grid: GridLayout, layoutShift: LayoutShift) {
  // Logs for dnd-engine debugging.
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
    const item = grid.items.find((prev) => prev.id === move.itemId)!;
    transforms[item.id] = {
      x: (move.x - item.x) * (cell.width + GAP),
      y: (move.y - item.y) * (cell.height + GAP),
      scaleX: 1,
      scaleY: 1,
    };
  }

  return transforms;
}

interface LayoutShift {
  path: Position[];
  hasConflicts: boolean;
  moves: readonly CommittedMove[];
  next: GridLayout;
}

export function calculateReorderShifts(
  grid: GridLayout,
  collisionRect: Rect,
  activeId: ItemId,
  prevPath: Position[]
): LayoutShift {
  const newPath = generatePath(prevPath, collisionRect);
  if (newPath.length === 0) {
    return {
      path: newPath,
      hasConflicts: false,
      moves: [],
      next: grid,
    };
  }

  const engine = new DndEngine(grid);
  engine.move({ itemId: activeId, path: newPath.slice(1) });
  const transition = engine.commit();

  return {
    path: newPath,
    hasConflicts: transition.conflicts.length > 0,
    moves: transition.moves,
    next: transition.end,
  };
}

export function calculateResizeShifts(grid: GridLayout, collisionRect: Rect, activeId: ItemId): LayoutShift {
  const engine = new DndEngine(grid);
  engine.resize({
    itemId: activeId,
    height: collisionRect.bottom - collisionRect.top,
    width: collisionRect.right - collisionRect.left,
  });
  const transition = engine.commit();

  return {
    path: [],
    hasConflicts: transition.conflicts.length > 0,
    moves: transition.moves,
    next: transition.end,
  };
}

function generatePath(prevPath: Position[], collisionRect: Rect): Position[] {
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
