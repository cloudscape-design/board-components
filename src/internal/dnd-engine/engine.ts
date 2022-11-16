// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, DndGrid, DndItem } from "./dnd-grid";
import { CommittedMove, GridDefinition, GridTransition, Item, ItemId, MoveCommand, ResizeCommand } from "./interfaces";

/**
  Applies user move to the grid of items.

  The move is defined as a path of a incremental steps in either vertical or horizontal direction.

  The produced result includes the final grid and a list of all item moves.
  The final grid can have unresolved conflicts that are resolvable by moving the target further.
 */
export function applyMove(gridDefinition: GridDefinition, { itemId, path }: MoveCommand): GridTransition {
  const grid = new DndGrid(gridDefinition, itemId);

  // TODO: validate path to be of single steps
  // TODO: validate path to not include repetitive steps

  for (const step of path) {
    const move: CommittedMove = { itemId, x: step.x, y: step.y, type: "USER" };

    findBlocks(grid, move);

    commitMove(grid, move);

    resolveConflicts(grid);
  }

  return createGridTransition(gridDefinition, grid);
}

/**
  Applies user resize to the grid of items.

  The produced result includes the final grid and a list of all item moves caused by the resize.
 */
export function applyResize(gridDefinition: GridDefinition, resize: ResizeCommand): GridTransition {
  const grid = new DndGrid(gridDefinition, resize.itemId);

  commitResize(grid, resize);

  resolveConflicts(grid);

  return createGridTransition(gridDefinition, grid);
}

/**
  Refloats the frid to ensure all items are in the top when not blocked by other items.
  This needs to be performed after the item is dropped.
 */
export function refloatGrid(gridDefinition: GridDefinition): GridTransition {
  const grid = new DndGrid(gridDefinition);

  refloatDndGrid(grid);

  return createGridTransition(gridDefinition, grid);
}

function resolveConflicts(grid: DndGrid): void {
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

function createGridTransition(start: GridDefinition, grid: DndGrid): GridTransition {
  const end = {
    items: start.items.map(({ id }) => grid.getItem(id)).sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y)),
    width: grid.width,
  };
  return { start, end, moves: grid.moves, blocks: [...grid.blocks] };
}

function findBlocks(grid: DndGrid, move: CommittedMove): void {
  grid.blocks = new Set<ItemId>();

  const moveTarget = grid.getItem(move.itemId);
  const direction = `${move.x - moveTarget.x}:${move.y - moveTarget.y}`;

  // TODO: map directions to Direction type
  switch (direction) {
    case "-1:0": {
      const left = Math.max(0, moveTarget.left - 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getLayoutConflict(left, y, moveTarget.id);
        if (block && block.x < left) {
          grid.blocks.add(block.id);
        }
      }
      break;
    }
    case "1:0": {
      const right = Math.min(grid.width - 1, moveTarget.right + 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getLayoutConflict(right, y, moveTarget.id);
        if (block && block.x + block.width - 1 > right) {
          grid.blocks.add(block.id);
        }
      }
      break;
    }
    case "0:-1": {
      const top = Math.max(0, moveTarget.top - 1);
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getLayoutConflict(x, top, moveTarget.id);
        if (block && block.y < top) {
          grid.blocks.add(block.id);
        }
      }
      break;
    }
    case "0:1": {
      const bottom = moveTarget.bottom + 1;
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getLayoutConflict(x, bottom, moveTarget.id);
        if (block && block.y + block.height - 1 > bottom) {
          grid.blocks.add(block.id);
        }
      }
      break;
    }
    default:
      throw new Error("Invalid move: only possible to move item one cell at a time.");
  }
}

function commitResize(grid: DndGrid, resize: ResizeCommand): void {
  const resizeTarget = grid.getItem(resize.itemId);

  grid.removeLayoutItem(resizeTarget);

  resizeTarget.height = resize.height;
  resizeTarget.width = Math.min(grid.width, resize.width);

  grid.insertLayoutItem(resizeTarget);

  findConflictsByItem(grid, resizeTarget);
}

function commitMove(grid: DndGrid, move: CommittedMove): void {
  const moveTarget = grid.getItem(move.itemId);

  grid.removeLayoutItem(moveTarget);

  moveTarget.committed = true;
  moveTarget.x = move.x;
  moveTarget.y = move.y;

  grid.insertLayoutItem(moveTarget);

  findConflictsByItem(grid, moveTarget);

  grid.moves.push(move);
}

// TODO: find conflicts while inserting items
function findConflictsByItem(grid: DndGrid, target: Item): void {
  // Find conflicts caused by the move.
  const conflicts = new Set<ItemId>(grid.conflicts);
  for (let y = 0; y < grid.layout.length; y++) {
    for (let x = 0; x < grid.width; x++) {
      const hasTarget = grid.layout[y][x].has(target.id);
      if (hasTarget) {
        for (const itemId of grid.layout[y][x]) {
          if (itemId !== target.id) {
            conflicts.add(itemId);
          }
        }
      }
    }
  }
  grid.conflicts = [...conflicts];
}

function tryFindVacantMove(grid: DndGrid, conflict: ItemId): null | CommittedMove {
  const conflictItem = grid.getItem(conflict);
  const conflictWith = getConflictWith(grid, conflictItem);
  const directions = getMoveDirections(grid, conflictWith);

  for (const direction of directions) {
    for (const move of getMovesForDirection(conflictItem, conflictWith, direction, "VACANT")) {
      if (validateVacantMove(grid, move)) {
        return move;
      }
    }
  }

  return null;
}

function tryFindPriorityMove(grid: DndGrid, conflict: ItemId): null | CommittedMove {
  const conflictItem = grid.getItem(conflict);
  const conflictWith = getConflictWith(grid, conflictItem);
  const directions = getMoveDirections(grid, conflictWith);

  for (const direction of directions) {
    for (const move of getMovesForDirection(conflictItem, conflictWith, direction, "PRIORITY")) {
      if (validatePriorityMove(grid, move) === "ok") {
        return move;
      }
    }
  }

  // If can't find a good move - "teleport" item to the bottom.
  const move: CommittedMove = { itemId: conflictItem.id, y: conflictItem.y + 1, x: conflictItem.x, type: "ESCAPE" };
  let canMove = validatePriorityMove(grid, move);
  while (canMove !== "ok") {
    move.y++;
    canMove = validatePriorityMove(grid, move);

    // Can't move over blocked items.
    if (canMove === "blocked") {
      return null;
    }
  }
  return move;
}

function getConflictWith(grid: DndGrid, targetItem: DndItem): DndItem {
  for (let y = targetItem.y; y < targetItem.y + targetItem.height; y++) {
    for (let x = targetItem.x; x < targetItem.x + targetItem.width; x++) {
      const conflict = grid.getLayoutConflict(x, y, targetItem.id);
      if (conflict) {
        return conflict;
      }
    }
  }
  throw new Error("Invariant violation - no conflicts found.");
}

function validateVacantMove(grid: DndGrid, moveAttempt: CommittedMove): boolean {
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

function validatePriorityMove(grid: DndGrid, moveAttempt: CommittedMove): "ok" | "blocked" | "priority" {
  const moveTarget = grid.getItem(moveAttempt.itemId);

  for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
    for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
      const newY = moveAttempt.y + (y - moveTarget.y);
      const newX = moveAttempt.x + (x - moveTarget.x);

      // Outside the grid.
      if (newY < 0 || newX < 0 || newX >= grid.width) {
        return "blocked";
      }

      for (const itemId of grid.layout[newY]?.[newX] ?? []) {
        const item = grid.getItem(itemId);

        // The probed destination has a committed item.
        if (item.committed) {
          return "priority";
        }

        // The probed destination i currently blocked.
        if (grid.blocks.has(itemId)) {
          return "blocked";
        }
      }
    }
  }

  return "ok";
}

// Retrieve all possible moves for the given direction (same direction but different length).
function getMovesForDirection(
  moveTarget: Item,
  conflict: DndItem,
  direction: Direction,
  moveType: CommittedMove["type"]
): CommittedMove[] {
  switch (direction) {
    case "top": {
      const conflictTop = conflict.y;
      const targetBottom = conflictTop;
      const targetTop = targetBottom - (moveTarget.height - 1);

      const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
      const moves: CommittedMove[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: targetTop - i, x: moveTarget.x, type: moveType });
      }

      return moves;
    }

    case "bottom": {
      const conflictBottom = conflict.y + conflict.height - 1;
      const targetBottom = conflictBottom;

      const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
      const moves: CommittedMove[] = [];
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
      const moves: CommittedMove[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft - i, type: moveType });
      }

      return moves;
    }

    case "right": {
      const conflictRight = conflict.x + conflict.width - 1;
      const targetLeft = conflictRight;

      const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX));
      const moves: CommittedMove[] = [];
      for (let i = distance; i >= 0; i--) {
        moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft + i, type: moveType });
      }

      return moves;
    }
  }
}

// Get priority move directions by comparing conflicting items positions.
function getMoveDirections(grid: DndGrid, origin: DndItem): Direction[] {
  const originMoves = grid.moves.filter((m) => m.itemId === origin.id);

  // The move is missing when origin resizes.
  const lastOriginMove = originMoves[originMoves.length - 1] || { x: origin.originalX, y: origin.originalY };

  const diffVertical = origin.originalY - lastOriginMove.y;
  const firstVertical = diffVertical > 0 ? "bottom" : "top";
  const nextVertical = firstVertical === "bottom" ? "top" : "bottom";

  const diffHorizontal = origin.originalX - lastOriginMove.x;
  const firstHorizontal = diffHorizontal > 0 ? "right" : "left";
  const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

  const directions: Direction[] =
    Math.abs(diffVertical) > Math.abs(diffHorizontal)
      ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
      : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];

  return directions;
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
        const item = [...grid.layout[y][x]][0];
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
