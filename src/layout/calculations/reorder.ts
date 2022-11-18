// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { DndEngine } from "../../internal/dnd-engine/engine";
import { CommittedMove, Position } from "../../internal/dnd-engine/interfaces";
import { Rect } from "./interfaces";

const GAP = 16;

function collisionsToRect(collisions: Array<GridLayoutItem>) {
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

export function createTransforms(
  newGrid: null | readonly GridLayoutItem[],
  prevGrid: null | readonly GridLayoutItem[],
  activeRect: { width: number; height: number }
) {
  if (!newGrid || !prevGrid) {
    return {};
  }
  return Object.fromEntries(
    newGrid.map((item) => {
      const oldItem = prevGrid.find((prev) => prev.id === item.id)!;
      return [
        item.id,
        {
          x: (item.x - oldItem.x) * (activeRect.width + GAP),
          y: (item.y - oldItem.y) * (activeRect.height + GAP),
          scaleX: 1,
          scaleY: 1,
        },
      ];
    })
  );
}

export interface LayoutShift {
  hasConflicts: boolean;
  current: {
    moves: CommittedMove[];
    items: readonly GridLayoutItem[];
  };
  committed: {
    moves: CommittedMove[];
    items: readonly GridLayoutItem[];
  };
}

export function calculateShifts(
  grid: readonly GridLayoutItem[],
  collisions: Array<GridLayoutItem>,
  activeItem: GridLayoutItem,
  columnns: number
): LayoutShift {
  const collisionRect = collisionsToRect(collisions);

  // TODO: take the actual movement path.
  const path = generatePath(activeItem, collisionRect);
  if (path.length === 0) {
    return { hasConflicts: false, current: { moves: [], items: grid }, committed: { moves: [], items: grid } };
  }

  const engine = new DndEngine({ items: grid, width: columnns });
  const moveTransition = engine.move({ itemId: activeItem.id, path });
  const commitTransition = engine.commit();

  return {
    hasConflicts: moveTransition.blocks.length > 0,
    current: { moves: moveTransition.moves, items: moveTransition.end.items },
    committed: { moves: commitTransition.moves, items: commitTransition.end.items },
  };
}

function generatePath(activeItem: GridLayoutItem, collisionRect: Rect) {
  let safetyCounter = 0;
  const path: Array<Position> = [];

  const vx = Math.sign(collisionRect.left - activeItem.x);
  const vy = Math.sign(collisionRect.top - activeItem.y);

  let x = activeItem.x;
  let y = activeItem.y;

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
