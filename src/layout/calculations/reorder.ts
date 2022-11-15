// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayoutItem } from "../../internal/base-types";
import { isInsideRect, itemToRect } from "./utils";

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
    newGrid.map((item, index) => [
      item.id,
      {
        x: (item.x - prevGrid[index].x) * (activeRect.width + GAP),
        y: (item.y - prevGrid[index].y) * (activeRect.height + GAP),
        scaleX: 1,
        scaleY: 1,
      },
    ])
  );
}

export function calculateShifts(
  grid: readonly GridLayoutItem[],
  collisions: Array<GridLayoutItem>,
  activeItem: GridLayoutItem
): null | readonly GridLayoutItem[] {
  const collisionRect = collisionsToRect(collisions);
  if (
    collisionRect.left === activeItem.x &&
    collisionRect.top === activeItem.y &&
    collisionRect.right === activeItem.x + activeItem.width &&
    collisionRect.bottom === activeItem.y + activeItem.height
  ) {
    return null;
  }
  const newGrid = grid.map((item) => ({ ...item }));
  const overItems = grid.filter((item) => isInsideRect(itemToRect(item), collisionRect));
  for (const overItem of overItems) {
    const vy = Math.sign(activeItem.y - overItem.y); // +1 up, -1 down
    const vx = Math.sign(activeItem.x - overItem.x); // +1 left, -1 right
    for (const item of newGrid) {
      if (
        item.y === activeItem.y && // TODO: support variable heights
        item.x * vx >= overItem.x * vx &&
        item.x * vx < activeItem.x * vx
      ) {
        item.x += vx;
      } else if (
        item.x >= overItem.x &&
        item.x + item.width <= overItem.x + overItem.width &&
        item.y * vy < activeItem.y * vy &&
        item.y * vy >= overItem.y * vy
      ) {
        item.y += vy;
      }
    }
  }
  // activeItem always fits the collision area
  const newActiveItem = newGrid.find((item) => item.id === activeItem.id)!;
  newActiveItem.x = collisionRect.left;
  newActiveItem.y = collisionRect.top;

  return newGrid;
}
