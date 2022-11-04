// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Active, CollisionDescriptor, Over } from "@dnd-kit/core";
import { LayoutItem } from "../internal/layout";

const GAP = 16;

export function createTransforms(
  newGrid: null | readonly LayoutItem[],
  prevGrid: null | readonly LayoutItem[],
  activeRect: { width: number; height: number }
) {
  if (!newGrid || !prevGrid) {
    return null;
  }
  // const transformX = (active.rect.current.initial!.width + GAP) * vx;
  // const transformY = (active.rect.current.initial!.height + GAP) * vy;
  return newGrid.map((item, index) => ({
    id: item.id,
    transform: {
      x: (item.x - prevGrid[index].x) * (activeRect.width + GAP),
      y: (item.y - prevGrid[index].y) * (activeRect.height + GAP),
      scaleX: 1,
      scaleY: 1,
    },
  }));
}

export function calculateShifts(
  grid: readonly LayoutItem[],
  collisions: readonly CollisionDescriptor[],
  active: Active,
  over: Over | null
): null | readonly LayoutItem[] {
  if (!over || over.id === active.id) {
    return null;
  }
  const newGrid = grid.slice().map((item) => ({ ...item }));
  const activeItem = grid.find((item) => item.id === active.id)!;
  const overItems = collisions.map((collision) => grid.find((item) => item.id === collision.id)!);
  for (const overItem of overItems) {
    const vy = Math.sign(activeItem.y - overItem.y); // +1 up, -1 down
    const vx = Math.sign(activeItem.x - overItem.x); // +1 left, -1 right
    for (const item of newGrid) {
      if (item.id === activeItem.id) {
        item.x = overItem.x;
        item.y = overItem.y;
        continue;
      }
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

  return newGrid;
}
