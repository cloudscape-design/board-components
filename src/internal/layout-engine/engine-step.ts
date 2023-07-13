// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, ItemId } from "../interfaces";
import { LayoutEngineGrid, LayoutEngineItem, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkMovesEqual } from "./utils";

/**
    TODO:
    - Test with extreme examples (6x20 board with many items) and ensure the algorithm never takes too long.
   */

// Issue moves on overlapping items trying to resolve all of them.
export function resolveOverlaps(userMove: CommittedMove, layoutState: LayoutEngineStepState): LayoutEngineStepState {
  const conflicts = findConflicts(layoutState.grid, userMove);
  const initialState = new MoveVariantState(layoutState.grid, layoutState.moves, conflicts);

  let moveVariants: MoveVariant[] = [{ state: initialState, move: userMove, moveScore: 0 }];
  let bestVariant: null | MoveVariantState = null;
  let safetyCounter = 1000;

  while (moveVariants.length > 0) {
    const nextVariants: MoveVariant[] = [];

    for (const { state, move, moveScore } of moveVariants) {
      if (bestVariant && state.score + moveScore >= bestVariant.score) {
        continue;
      }

      makeMove(state, move, moveScore);

      if (state.overlaps.size === 0) {
        bestVariant = state;
      } else {
        nextVariants.push(...findNextVariants(state));
      }
    }

    moveVariants = nextVariants;

    safetyCounter--;
    if (safetyCounter <= 0) {
      throw new Error("Invariant violation: reached safety counter when resolving overlaps.");
    }
  }

  if (!bestVariant) {
    return layoutState;
  }

  return refloatGrid(bestVariant, userMove);
}

// Find items that can "float" to the top and apply the necessary moves.
export function refloatGrid(layoutState: LayoutEngineStepState, userMove?: CommittedMove): LayoutEngineStepState {
  if (layoutState.conflicts.size > 0) {
    return layoutState;
  }

  const grid = LayoutEngineGrid.clone(layoutState.grid);
  const moves = [...layoutState.moves];
  const conflicts = new Set(...layoutState.conflicts);

  let needAnotherRefloat = false;

  for (const item of grid.items) {
    // The active item is skipped until the operation is committed.
    if (item.id === userMove?.itemId) {
      continue;
    }

    const move: CommittedMove = {
      itemId: item.id,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      type: "FLOAT",
    };
    for (move.y; move.y >= 0; move.y--) {
      if (!validateVacantMove(grid, { ...move, y: move.y - 1 })) {
        break;
      }
    }
    if (item.y !== move.y) {
      makeMove({ grid, moves, conflicts, overlaps: new Set(), score: 0 }, move, 0);
      needAnotherRefloat = true;
    }
  }

  // TODO: avoid cloning for recursive refloat
  if (needAnotherRefloat) {
    refloatGrid({ grid, moves, conflicts }, userMove);
  }

  return { grid, moves, conflicts };
}

export class LayoutEngineStepState {
  public grid: ReadonlyLayoutEngineGrid;
  public moves: readonly CommittedMove[];
  public conflicts: ReadonlySet<ItemId>;

  constructor(grid: LayoutEngineGrid, moves = new Array<CommittedMove>(), conflicts = new Set<ItemId>()) {
    this.grid = grid;
    this.moves = moves;
    this.conflicts = conflicts;
  }
}

class MoveVariantState {
  public grid: LayoutEngineGrid;
  public moves: CommittedMove[];
  public conflicts: Set<ItemId>;
  public overlaps: Set<ItemId>;
  public score: number;

  constructor(
    grid: ReadonlyLayoutEngineGrid,
    moves: readonly CommittedMove[],
    conflicts = new Set<ItemId>(),
    overlaps = new Set<ItemId>(),
    score = 0
  ) {
    this.grid = LayoutEngineGrid.clone(grid);
    this.moves = [...moves];
    this.conflicts = conflicts;
    this.overlaps = overlaps;
    this.score = score;
  }

  static clone({ grid, moves, conflicts, overlaps, score }: MoveVariantState) {
    return {
      grid: LayoutEngineGrid.clone(grid),
      moves: [...moves],
      conflicts,
      overlaps: new Set([...overlaps]),
      score,
    };
  }
}

interface MoveVariant {
  state: MoveVariantState;
  move: CommittedMove;
  moveScore: number;
}

function makeMove(state: MoveVariantState, nextMove: CommittedMove, moveScore: number): void {
  const addOverlap = (itemId: ItemId) => {
    if (!state.conflicts.has(itemId)) {
      state.overlaps.add(itemId);
    }
  };
  switch (nextMove.type) {
    case "MOVE":
    case "OVERLAP":
    case "FLOAT":
      state.grid.move(nextMove.itemId, nextMove.x, nextMove.y, addOverlap);
      break;
    case "INSERT":
      state.grid.insert({ id: nextMove.itemId, ...nextMove }, addOverlap);
      break;
    case "REMOVE":
      state.grid.remove(nextMove.itemId);
      break;
    case "RESIZE":
      state.grid.resize(nextMove.itemId, nextMove.width, nextMove.height, addOverlap);
      break;
  }
  state.moves.push(nextMove);
  state.overlaps.delete(nextMove.itemId);
  state.score += moveScore;
}

function findNextVariants(state: MoveVariantState): MoveVariant[] {
  const nextMoveVariants: MoveVariant[] = [];

  for (const overlap of [...state.overlaps]) {
    const directions: Direction[] = ["down", "left", "right", "up"];
    for (const moveDirection of directions) {
      const moveScore = getDirectionMoveScore(state, overlap, moveDirection);
      if (moveScore !== null) {
        const moveTarget = state.grid.getItem(overlap);
        const overlapIssuer = getOverlapWith(state.grid, moveTarget);
        const move = getMoveForDirection(moveTarget, overlapIssuer, moveDirection);
        nextMoveVariants.push({ state: MoveVariantState.clone(state), move, moveScore });
      }
    }
  }

  return nextMoveVariants;
}

function getDirectionMoveScore(state: MoveVariantState, overlap: ItemId, moveDirection: Direction): null | number {
  const activeId = state.moves[0].itemId;
  const moveTarget = state.grid.getItem(overlap);
  const overlapIssuer = getOverlapWith(state.grid, moveTarget);
  const move = getMoveForDirection(moveTarget, overlapIssuer, moveDirection);

  for (const previousMove of state.moves) {
    if (checkMovesEqual(previousMove, move)) {
      return null;
    }
  }

  let isVacant = false;

  for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
    for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
      const newY = move.y + (y - moveTarget.y);
      const newX = move.x + (x - moveTarget.x);

      // Outside the grid.
      if (newY < 0 || newX < 0 || newX >= state.grid.width) {
        return null;
      }

      for (const item of state.grid.getCell(newX, newY)) {
        // Can't overlap with the active item.
        if (item.id === activeId) {
          return null;
        }

        // Can't overlap with the conflicted item.
        if (state.conflicts.has(item.id)) {
          return null;
        }
      }

      // The probed destination is occupied.
      if (!state.grid.getCellOverlap(newX, newY, move.itemId)) {
        isVacant = true;
      }
    }
  }

  const isSwap = checkItemsSwap(state.moves, overlapIssuer, move, moveTarget);

  if (isVacant && isSwap && overlapIssuer.id === activeId) {
    return 1;
  }
  if (isVacant && !isSwap) {
    return 2;
  }
  if (isVacant && overlapIssuer.id !== activeId) {
    return 2;
  }
  if (isVacant) {
    return 6;
  }
  return 5;
}

function validateVacantMove(grid: LayoutEngineGrid, move: CommittedMove): boolean {
  const moveTarget = grid.getItem(move.itemId);

  for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
    for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
      const newY = move.y + (y - moveTarget.y);
      const newX = move.x + (x - moveTarget.x);

      // Outside the grid.
      if (newY < 0 || newX < 0 || newX >= grid.width) {
        return false;
      }

      // The probed destination is occupied.
      if (grid.getCellOverlap(newX, newY, move.itemId)) {
        return false;
      }
    }
  }

  return true;
}

function checkItemsSwap(
  moves: CommittedMove[],
  issuer: LayoutEngineItem,
  move: CommittedMove,
  moveTarget: LayoutEngineItem
) {
  const issuerDiff = getLastStepDiff(moves, issuer);
  const moveDiff = getLastStepDiff([...moves, move], moveTarget);
  return (
    (issuerDiff.x < 0 && moveDiff.x > 0) ||
    (issuerDiff.x > 0 && moveDiff.x < 0) ||
    (issuerDiff.y < 0 && moveDiff.y > 0) ||
    (issuerDiff.y > 0 && moveDiff.y < 0)
  );
}

function getLastStepDiff(moves: CommittedMove[], issuer: LayoutEngineItem) {
  const issuerMoves = moves.filter((move) => move.itemId === issuer.id);
  const originalParams = {
    x: issuer.originalX,
    y: issuer.originalY,
    width: issuer.originalWidth,
    height: issuer.originalHeight,
  };
  const prevIssuerMove = issuerMoves[issuerMoves.length - 2] ?? originalParams;
  const lastIssuerMove = issuerMoves[issuerMoves.length - 1] ?? originalParams;
  const diff = {
    x: prevIssuerMove.x - lastIssuerMove.x,
    y: prevIssuerMove.y - lastIssuerMove.y,
    width: prevIssuerMove.width - lastIssuerMove.width,
    height: prevIssuerMove.height - lastIssuerMove.height,
  };
  return diff.x || diff.y ? { x: diff.x, y: diff.y } : { x: diff.width, y: diff.height };
}

function getOverlapWith(grid: LayoutEngineGrid, targetItem: LayoutEngineItem): LayoutEngineItem {
  for (let y = targetItem.y; y < targetItem.y + targetItem.height; y++) {
    for (let x = targetItem.x; x < targetItem.x + targetItem.width; x++) {
      const overlap = grid.getCellOverlap(x, y, targetItem.id);
      if (overlap) {
        return overlap;
      }
    }
  }
  throw new Error("Invariant violation - no overlaps found.");
}

// Retrieve first possible move for the given direction to resolve the overlap.
function getMoveForDirection(
  moveTarget: LayoutEngineItem,
  overlap: LayoutEngineItem,
  direction: Direction
): CommittedMove {
  const common = {
    itemId: moveTarget.id,
    width: moveTarget.width,
    height: moveTarget.height,
    type: "OVERLAP" as const,
  };
  switch (direction) {
    case "up": {
      return { ...common, y: overlap.top - moveTarget.height, x: moveTarget.x };
    }
    case "down": {
      return { ...common, y: overlap.bottom + 1, x: moveTarget.x };
    }
    case "left": {
      return { ...common, y: moveTarget.y, x: overlap.left - moveTarget.width };
    }
    case "right": {
      return { ...common, y: moveTarget.y, x: overlap.right + 1 };
    }
  }
}

// Find items that the active item cannot be moved over with the current move.
function findConflicts(grid: ReadonlyLayoutEngineGrid, move: CommittedMove): Set<ItemId> {
  if (move.type !== "MOVE") {
    return new Set();
  }

  const conflicts = new Set<ItemId>();
  const moveTarget = grid.getItem(move.itemId);
  const direction = `${move.x - moveTarget.x}:${move.y - moveTarget.y}`;

  switch (direction) {
    case "-1:0": {
      const left = Math.max(0, moveTarget.left - 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getCellOverlap(left, y, moveTarget.id);
        if (block && block.x < left) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "1:0": {
      const right = Math.min(grid.width - 1, moveTarget.right + 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getCellOverlap(right, y, moveTarget.id);
        if (block && block.x + block.width - 1 > right) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "0:-1": {
      const top = Math.max(0, moveTarget.top - 1);
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getCellOverlap(x, top, moveTarget.id);
        if (block && block.y < top) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "0:1": {
      const bottom = moveTarget.bottom + 1;
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getCellOverlap(x, bottom, moveTarget.id);
        if (block && block.y + block.height - 1 > bottom) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    default:
    // Ignore
  }

  return conflicts;
}
