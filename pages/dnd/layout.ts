// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Active, CollisionDescriptor, Over } from "@dnd-kit/core";
import { Item } from "./items";

interface Layout {
  id: number;
  x: number;
  y: number;
  width: number;
}
const GAP = 10;

export function itemsToGrid(items: ReadonlyArray<Item>, columns: number) {
  let x = 0;
  let y = 0;
  const layout: Array<Layout> = [];
  for (const item of items) {
    const colspan = item.columnSpan ?? 1;
    if (x + colspan > columns) {
      y++;
      x = 0;
    }
    layout.push({ id: item.id, x, y, width: colspan });
    x += colspan;
  }
  return layout;
}

export function gridToItems(grid: ReadonlyArray<Layout>, sourceItems: ReadonlyArray<Item>) {
  const sorted = grid.slice().sort((a, b) => {
    if (a.y !== b.y) {
      return a.y > b.y ? 1 : -1;
    }
    return a.x > b.x ? 1 : -1;
  });

  return sorted.map((layout) => sourceItems.find((item) => item.id === layout.id)!);
}

export function createTransforms(
  newGrid: ReadonlyArray<Layout> | null,
  prevGrid: ReadonlyArray<Layout> | null,
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
  grid: Array<Layout>,
  collisions: ReadonlyArray<CollisionDescriptor>,
  active: Active,
  over: Over | null
) {
  if (!over || over.id === active.id) {
    return null;
  }
  const newGrid = grid.slice().map((item) => ({ ...item }));
  // const realCollisions = collisions.filter((collision) => collision.id !== activeItem.id);
  const activeItem = grid.find((item) => item.id === active.id)!;
  const overItem = grid.find((item) => item.id === over.id)!;
  // const collisionBox = collisions
  //   .filter((collision) => collision.id !== activeItem.id)
  //   .reduce(
  //     (box, collision) => ({
  //       top: Math.min(box.top, collision.data.droppableContainer.rect.current!.top),
  //       left: Math.min(box.left, collision.data.droppableContainer.rect.current!.left),
  //       right: Math.max(box.right, collision.data.droppableContainer.rect.current!.right),
  //       bottom: Math.max(box.bottom, collision.data.droppableContainer.rect.current!.bottom),
  //     }),
  //     {
  //       top: Number.POSITIVE_INFINITY,
  //       left: Number.POSITIVE_INFINITY,
  //       right: Number.NEGATIVE_INFINITY,
  //       bottom: Number.NEGATIVE_INFINITY,
  //     }
  //   );
  // const vy = collisionBox.top > activeItem.rect.current.initial!.bottom ? 1 : -1;
  // const vx = collisionBox.right > activeItem.rect.current.initial!.left ? 1 : -1;
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

  return newGrid;
}
