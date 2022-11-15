// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MoveType } from "./interfaces";
import { DndItem, MovePath } from "./interfaces";
import { GridDefinition, ItemId, Item, DndGrid, Move, DndGridCell, Direction, GridTransition } from "./interfaces";

/**
  Applies user move to the grid of items.

  The move is defined as a path of a incremental steps in either vertical or horizontal direction.

  The produced result includes the final grid and a list of all item moves.
  The final grid can have unresolved conflicts that are resolvable by moving the target further.
 */
export function applyMove(gridDefinition: GridDefinition, movePath: MovePath): GridTransition {
  // Create mutable dnd-grid structure to be used for computations.
  const grid = createDndGrid(gridDefinition, movePath.itemId);

  for (const step of movePath.path) {
    const moveTarget = grid.getItem(movePath.itemId);
    const move: Move = { itemId: movePath.itemId, x: step.x, y: step.y, type: "USER" };

    // Update origin.
    moveTarget.originalX = moveTarget.x;
    moveTarget.originalY = moveTarget.y;

    // Find elements that can't be swapped with the target yet.
    grid.blocks = findBlocks(grid, move, moveTarget);

    // Commit the move to find possible conflicts.
    commitMove(grid, move);

    const tier2Conflicts: ItemId[] = [];

    // Try resolving conflicts by finding the vacant space considering the move directions.
    let conflict = grid.conflicts.pop();
    while (conflict) {
      // Ignoring blocked items - those must stay in place.
      if (grid.blocks.has(conflict)) {
        conflict = grid.conflicts.pop();
        continue;
      }

      const nextMove = tryFindVacantMove(grid, conflict);
      if (nextMove) {
        commitMove(grid, nextMove);
      } else {
        tier2Conflicts.push(conflict);
      }
      conflict = grid.conflicts.pop();
    }

    // Try resolving conflicts by moving against items that have the same or lower priority.
    grid.conflicts = tier2Conflicts;
    conflict = grid.conflicts.pop();
    while (conflict) {
      // Ignoring blocked items - those must stay in place.
      if (grid.blocks.has(conflict)) {
        conflict = grid.conflicts.pop();
        continue;
      }

      const nextMove = tryFindPriorityMove(grid, conflict);
      if (nextMove) {
        commitMove(grid, nextMove);
      } else {
        // There is no good way to resolve conflicts at this point.
      }
      conflict = grid.conflicts.pop();
    }
  }

  // Create new grid definition from the current state of dnd-grid.
  // The transition contains the original grid, the new grid, and the list of all moves that have been performed.
  return createGridTransition(gridDefinition, grid);
}

/**
  Refloats the frid to ensure all items are in the top when not blocked by other items.
  This needs to be performed after the item is dropped.
 */
export function refloatGrid(gridDefinition: GridDefinition): GridTransition {
  // Create mutable dnd-grid structure to be used for computations.
  const grid = createDndGrid(gridDefinition);

  // All grid items are expected to "float" to the top. After all D&D movements are committed this property is to be reassured.
  refloatDndGrid(grid);

  // Create new grid definition from the current state of dnd-grid.
  return createGridTransition(gridDefinition, grid);
}

function createDndGrid(gridDefinition: GridDefinition, target?: ItemId): DndGrid {
  const byId = new Map<ItemId, DndItem>();
  const width = gridDefinition.width;
  const layout: DndGridCell[][] = [];

  for (const item of gridDefinition.items) {
    byId.set(item.id, {
      ...item,
      originalY: item.y,
      originalX: item.x,
      priority: item.id === target ? Number.POSITIVE_INFINITY : 0,
    });

    for (let y = item.y; y < item.y + item.height; y++) {
      while (layout.length <= y) {
        layout.push([...Array(width)].map(() => []));
      }

      for (let x = item.x; x < item.x + item.width; x++) {
        layout[y][x].push(item.id);
      }
    }
  }

  const getItem = (id: ItemId): DndItem => {
    const item = byId.get(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found in the grid.`);
    }
    return item;
  };

  return { width, layout, moves: [], conflicts: [], blocks: new Set(), getItem };
}

function createGridTransition(start: GridDefinition, grid: DndGrid): GridTransition {
  const itemsSet = new Set<ItemId>();

  for (let y = 0; y < grid.layout.length; y++) {
    for (let x = 0; x < grid.width; x++) {
      for (const item of grid.layout[y][x]) {
        item && itemsSet.add(item);
      }
    }
  }

  const items = [...itemsSet].map((id) => grid.getItem(id)).sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y));

  const end = { items, width: grid.width };

  return {
    start,
    end,
    moves: grid.moves,
    blocks: [...grid.blocks],
  };
}

function findBlocks(grid: DndGrid, move: Move, origin: Item): Set<ItemId> {
  const blocks = new Set<ItemId>();

  const diffHorizontal = move.x - origin.x;
  const diffVertical = move.y - origin.y;

  // Only allow to move one step at a time
  if (Math.abs(diffHorizontal) + Math.abs(diffVertical) !== 1) {
    throw new Error("Invalid move");
  }

  if (diffHorizontal !== 0 && diffVertical === 0) {
    // Move to the right
    if (diffHorizontal > 0) {
      const rightEdgeStart = origin.x + origin.width;
      const rightEdge = Math.min(grid.width - 1, rightEdgeStart + diffHorizontal - 1);
      for (let y = origin.y; y < origin.y + origin.height; y++) {
        for (const overlapId of grid.layout[y][rightEdge]) {
          if (overlapId && overlapId !== move.itemId) {
            const overlapItem = grid.getItem(overlapId);
            if (overlapItem.x + overlapItem.width - 1 > rightEdge) {
              blocks.add(overlapId);
            }
          }
        }
      }
    }
    // Move to the left
    else {
      const leftEdge = Math.max(0, move.x);
      for (let y = origin.y; y < origin.y + origin.height; y++) {
        for (const overlapId of grid.layout[y][leftEdge]) {
          if (overlapId && overlapId !== move.itemId) {
            const overlapItem = grid.getItem(overlapId);
            if (overlapItem.x < leftEdge) {
              blocks.add(overlapId);
            }
          }
        }
      }
    }
  }

  if (diffVertical !== 0 && diffHorizontal === 0) {
    // Move to the bottom
    if (diffVertical > 0) {
      const bottomEdgeStart = origin.y + origin.height;
      const bottomEdge = bottomEdgeStart + diffVertical - 1;
      for (let x = origin.x; x < origin.x + origin.width; x++) {
        for (const overlapId of grid.layout[bottomEdge]?.[x] ?? []) {
          if (overlapId && overlapId !== move.itemId) {
            const overlapItem = grid.getItem(overlapId);
            if (overlapItem.y + overlapItem.height - 1 > bottomEdge) {
              blocks.add(overlapId);
            }
          }
        }
      }
    }
    // Move to the top
    else {
      const topEdge = Math.max(0, move.y);
      for (let x = origin.x; x < origin.x + origin.width; x++) {
        for (const overlapId of grid.layout[topEdge]?.[x] ?? []) {
          if (overlapId && overlapId !== move.itemId) {
            const overlapItem = grid.getItem(overlapId);
            if (overlapItem.y < topEdge) {
              blocks.add(overlapId);
            }
          }
        }
      }
    }
  }

  return blocks;
}

// Performs move on the grid layout.
function commitMove(grid: DndGrid, move: Move): void {
  const moveTarget = grid.getItem(move.itemId);

  // Remove old.
  for (let y = moveTarget.y + moveTarget.height - 1; y >= moveTarget.y; y--) {
    for (let x = moveTarget.x + moveTarget.width - 1; x >= moveTarget.x; x--) {
      grid.layout[y][x] = grid.layout[y][x].filter((id) => id !== moveTarget.id);
    }
  }

  // Insert new.
  for (let y = moveTarget.y + moveTarget.height - 1; y >= moveTarget.y; y--) {
    for (let x = moveTarget.x + moveTarget.width - 1; x >= moveTarget.x; x--) {
      const newY = move.y + (y - moveTarget.y);
      const newX = move.x + (x - moveTarget.x);

      // Insert new rows of needed.
      while (!grid.layout[newY]) {
        grid.layout.push([...Array(grid.width)].map(() => []));
      }

      // Move item to a new place.
      grid.layout[newY][newX] = grid.layout[newY][newX].filter((id) => id !== moveTarget.id);
      grid.layout[newY][newX].push(moveTarget.id);
    }
  }

  // Update item's priority to minimize the amount of moves applied per item.
  moveTarget.priority++;
  // Update item's position.
  moveTarget.x = move.x;
  moveTarget.y = move.y;

  if (moveTarget.priority === 10) {
    throw new Error("The item has been moved too many times. It is likely an infinite loop.");
  }

  // Find conflicts caused by the move.
  const conflicts = new Set<ItemId>(grid.conflicts);
  for (let y = 0; y < grid.layout.length; y++) {
    for (let x = 0; x < grid.width; x++) {
      const hasTarget = grid.layout[y][x].some((id) => id === moveTarget.id);
      if (hasTarget) {
        for (const itemId of grid.layout[y][x]) {
          if (itemId !== moveTarget.id) {
            conflicts.add(itemId);
          }
        }
      }
    }
  }
  grid.conflicts = [...conflicts];

  grid.moves.push(move);
}

function tryFindVacantMove(grid: DndGrid, conflict: ItemId): null | Move {
  const conflictItem = grid.getItem(conflict);
  const conflictWith = getConflictWith(grid, conflictItem);
  const directions = getMoveDirections(conflictItem, conflictWith);

  for (const direction of directions) {
    for (const moveAttempt of getMovesForDirection(conflictItem, conflictWith, direction, "VACANT")) {
      if (validateVacantMove(grid, moveAttempt)) {
        return { ...moveAttempt, type: "VACANT" };
      }
    }
  }

  return null;
}

function tryFindPriorityMove(grid: DndGrid, conflict: ItemId): null | Move {
  const conflictItem = grid.getItem(conflict);
  const conflictWith = getConflictWith(grid, conflictItem);
  const directions = getMoveDirections(conflictItem, conflictWith);

  for (const direction of directions) {
    for (const moveAttempt of getMovesForDirection(conflictItem, conflictWith, direction, "PRIORITY")) {
      if (validatePriorityMove(grid, moveAttempt)) {
        return moveAttempt;
      }
    }
  }

  return null;

  // If can't find a good move - "teleport" item to the bottom.
  // const moveAttempt = { itemId: conflictItem.id, y: conflictItem.y + 1, x: conflictItem.x };
  // while (!validatePriorityMove(grid, moveAttempt)) {
  //   moveAttempt.y++;
  // }
  // return moveAttempt;
}

function getConflictWith(grid: DndGrid, conflictItem: DndItem): DndItem {
  for (let y = conflictItem.y; y < conflictItem.y + conflictItem.height; y++) {
    for (let x = conflictItem.x; x < conflictItem.x + conflictItem.width; x++) {
      for (const item of grid.layout[y][x]) {
        if (item && item !== conflictItem.id) {
          return grid.getItem(item);
        }
      }
    }
  }
  throw new Error("Invariant violation - no conflicts found.");
}

function validateVacantMove(grid: DndGrid, moveAttempt: Move): boolean {
  const moveTarget = grid.getItem(moveAttempt.itemId);

  for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
    for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
      const newY = moveAttempt.y + (y - moveTarget.y);
      const newX = moveAttempt.x + (x - moveTarget.x);

      // Outside the grid.
      if (newY < 0 || newX < 0 || newX >= grid.width) {
        return false;
      }

      // The probed destination cell is occupied.
      for (const item of grid.layout[newY]?.[newX] ?? []) {
        if (item !== moveAttempt.itemId) {
          return false;
        }
      }
    }
  }

  return true;
}

function validatePriorityMove(grid: DndGrid, moveAttempt: Move): boolean {
  const moveTarget = grid.getItem(moveAttempt.itemId);

  for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
    for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
      const newY = moveAttempt.y + (y - moveTarget.y);
      const newX = moveAttempt.x + (x - moveTarget.x);

      // Outside the grid.
      if (newY < 0 || newX < 0 || newX >= grid.width) {
        return false;
      }

      for (const itemId of grid.layout[newY]?.[newX] ?? []) {
        const item = grid.getItem(itemId);

        // The probed destination cell has higher prio.
        if (item.priority > moveTarget.priority) {
          return false;
        }

        // The probed destination i currently blocked.
        if (grid.blocks.has(itemId)) {
          return false;
        }
      }
    }
  }

  return true;
}

// Retrieve all possible moves for the given direction (same direction but different length).
function getMovesForDirection(moveTarget: Item, conflict: DndItem, direction: Direction, moveType: MoveType): Move[] {
  switch (direction) {
    case "top": {
      const conflictTop = conflict.y;
      const targetBottom = conflictTop;
      const targetTop = targetBottom - (moveTarget.height - 1);

      const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
      const moves: Move[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: targetTop - i, x: moveTarget.x, type: moveType });
      }

      return moves;
    }

    case "bottom": {
      const conflictBottom = conflict.y + conflict.height - 1;
      const targetBottom = conflictBottom;

      const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
      const moves: Move[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: targetBottom + i, x: moveTarget.x, type: moveType });
      }

      return moves;
    }

    case "left": {
      const conflictLeft = conflict.x;
      const targetRight = conflictLeft;
      const targetLeft = targetRight - (moveTarget.width - 1);

      const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX));
      const moves: Move[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft - i, type: moveType });
      }

      return moves;
    }

    case "right": {
      const conflictRight = conflict.x + conflict.width - 1;
      const targetLeft = conflictRight;

      const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX));
      const moves: Move[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft + i, type: moveType });
      }

      return moves;
    }
  }
}

// Get priority move directions by comparing conflicting items positions.
function getMoveDirections(moveTarget: Item, origin: DndItem): Direction[] {
  const diffVertical = getDiffVertical(origin, moveTarget);
  const firstVertical = diffVertical > 0 ? "bottom" : "top";
  const nextVertical = firstVertical === "bottom" ? "top" : "bottom";

  const diffHorizontal = getDiffHorizontal(origin, moveTarget);
  const firstHorizontal = diffHorizontal > 0 ? "right" : "left";
  const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

  const directions: Direction[] =
    Math.abs(diffVertical) > Math.abs(diffHorizontal)
      ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
      : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];

  return directions;
}

function getDiffHorizontal(origin: DndItem, source: Item): number {
  // Origin moved vertically - ignoring horizontal diff
  if (origin.originalX === origin.x) {
    return 0;
  }

  const originLeft = origin.originalX;
  const originRight = origin.originalX + origin.width - 1;
  const sourceLeft = source.x;
  const sourceRight = source.x + source.width - 1;

  if (originLeft === sourceLeft && originRight === sourceRight) {
    return 0;
  }
  if (originLeft <= sourceLeft) {
    return -1;
  }
  if (sourceRight <= originRight) {
    return 1;
  }
  return 0;
}

function getDiffVertical(origin: DndItem, source: Item): number {
  // Origin moved horizontally - ignoring vertical diff
  if (origin.originalY === origin.y) {
    return 0;
  }

  const originTop = origin.originalY;
  const originBottom = origin.originalY + origin.height - 1;
  const sourceTop = source.y;
  const sourceBottom = source.y + source.height - 1;

  if (originTop === sourceTop && originBottom === sourceBottom) {
    return 0;
  }
  if (originTop <= sourceTop) {
    return -1;
  }
  if (sourceBottom <= originBottom) {
    return 1;
  }
  return 0;
}

// Find items that can "float" to the top and apply the necessary moves.
function refloatDndGrid(grid: DndGrid): void {
  let needRefloat = true;

  while (needRefloat) {
    let floatCandidates: [id: ItemId, affordance: number][] = [];
    const floatAffordance: number[][] = [];

    for (let y = 0; y < grid.layout.length; y++) {
      floatAffordance.push(Array(grid.width).fill(0));

      const itemFloatAfforance = new Map<ItemId, number>();

      for (let x = 0; x < grid.width; x++) {
        const item = grid.layout[y][x][0];
        const prevRowAffordance = floatAffordance[y - 1]?.[x] ?? 0;

        if (item) {
          floatAffordance[y][x] = 0;

          const prevItemAffordance = itemFloatAfforance.get(item);
          if (prevItemAffordance === undefined) {
            itemFloatAfforance.set(item, prevRowAffordance);
          } else {
            itemFloatAfforance.set(item, Math.min(prevItemAffordance, prevRowAffordance));
          }
        } else {
          floatAffordance[y][x] = prevRowAffordance + 1;
        }
      }

      floatCandidates = [...itemFloatAfforance.entries()].filter(([, affordance]) => affordance > 0);

      if (floatCandidates.length > 0) {
        break;
      }
    }

    needRefloat = floatCandidates.length > 0;

    for (const [id, affordance] of floatCandidates) {
      const item = grid.getItem(id);
      commitMove(grid, { itemId: id, y: item.y - affordance, x: item.x, type: "FLOAT" });
    }
  }
}
