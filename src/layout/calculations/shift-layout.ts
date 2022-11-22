// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Transform } from "@dnd-kit/utilities";
import { toString as engineToString } from "../../internal/dnd-engine/debug-tools";
import { DndEngine } from "../../internal/dnd-engine/engine";
import { CommittedMove } from "../../internal/dnd-engine/interfaces";
import { GridLayoutItem, ItemId } from "../../internal/interfaces";
import { Position, Rect } from "../../internal/interfaces";

const GAP = 16;

export function printLayoutDebug(content: readonly GridLayoutItem[], columns: number, layoutShift: LayoutShift) {
  // Logs for dnd-engine debugging.
  console.log("Grid before move:");
  console.log(engineToString({ items: content, columns }));

  console.log("Grid after move:");
  console.log(engineToString({ items: layoutShift.items, columns }));

  console.log("Layout shift:");
  console.log(layoutShift);
}

export function createTransforms(
  grid: readonly GridLayoutItem[],
  moves: readonly CommittedMove[],
  cell: { width: number; height: number }
) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.find((prev) => prev.id === move.itemId)!;
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
  items: readonly GridLayoutItem[];
}

export function calculateReorderShifts(
  grid: readonly GridLayoutItem[],
  collisionRect: Rect,
  activeId: ItemId,
  prevPath: Position[],
  columns: number
): LayoutShift {
  const newPath = generatePath(prevPath, collisionRect);
  if (newPath.length === 0) {
    return {
      path: newPath,
      hasConflicts: false,
      moves: [],
      items: grid,
    };
  }

  const engine = new DndEngine({ items: grid, columns });
  engine.move({ itemId: activeId, path: newPath.slice(1) });
  const transition = engine.commit();

  return {
    path: newPath,
    hasConflicts: transition.conflicts.length > 0,
    moves: transition.moves,
    items: transition.end.items,
  };
}

export function calculateResizeShifts(
  grid: readonly GridLayoutItem[],
  collisionRect: Rect,
  activeId: ItemId,
  columns: number
): LayoutShift {
  const engine = new DndEngine({ items: grid, columns });
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
    items: transition.end.items,
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
