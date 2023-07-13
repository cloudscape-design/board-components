// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, ItemId } from "../interfaces";
import { LayoutEngineGrid, LayoutEngineItem, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkMovesEqual } from "./utils";

/**
  TODO:
  - Test with extreme examples (6x20 board with many items) and ensure the algorithm never takes too long.
  - Ensure overlaps resolution is always possible w/o escape moves as it might not be so when there are conflicts.
  */

/**
 * The user commands in the layout engine are applied step by step.
 * The class describes the layout engine state at a particular step.
 * The state of the last performed state describes the command result.
 */
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

/**
 * The function takes the current layout state (item placements from the previous steps and all moves done so far)
 * and a user command increment that describes an item transition by one cell in some direction.
 * The function finds overlapping elements and resolves all overlaps if possible (always possible when no conflicts).
 * The result in an updated state (new item placements, additional moves, and item conflicts if any).
 */
export function resolveOverlaps(layoutState: LayoutEngineStepState, userMove: CommittedMove): LayoutEngineStepState {
  // For better UX the layout engine is optimized for item swaps.
  // The swapping is only preferred for the user-controlled item and it can only happen when the item overlaps another
  // item past its midpoint. When the overlap is not enough, the underlying item is considered a conflict and it is not
  // allowed to move anywhere. The user command cannot be committed at this step.
  const conflicts = findConflicts(layoutState.grid, userMove);

  // The user moves are always applied as is. When the user-controlled item overlaps with other items and there is
  // no conflict, the type="OVERLAP" moves are performed to settle the grid so that no items overlap with one another.
  // For this type of move multiple solutions are often available. To ensure the best resolution all solutions are tried
  // and a score is given to each. Those resolution with the minimal score wins.
  // The process stars from the initial state and the user move. The initial score and the user move score are 0.
  const initialState = new MoveSolutionState(layoutState.grid, layoutState.moves, conflicts);

  let moveSolutions: MoveSolution[] = [{ state: initialState, move: userMove, moveScore: 0 }];
  let bestSolution: null | MoveSolutionState = null;
  let safetyCounter = 1000;

  // The resolution process continues until there is at least one reasonable solution left.
  // Because it is always possible to move items down and the duplicate moves are not allowed,
  // the repetitive or expensive solutions are gradually removed.
  // The safety counter ensures the logical errors to not cause an infinite loop.
  while (moveSolutions.length > 0) {
    const nextSolutions: MoveSolution[] = [];

    for (const { state, move, moveScore } of moveSolutions) {
      // Discard the solution before performing the move if its next score is already above the best score found so far.
      if (bestSolution && state.score + moveScore >= bestSolution.score) {
        continue;
      }

      // Perform the move by mutating the solution's state.
      // This state is not shared and mutating it is safe. It is done to avoid unnecessary cloning.
      makeMove(state, move, moveScore);

      // If no overlaps are left the solution is considered valid and the best so far.
      // The next solution having the same or higher score will be discarded.
      if (state.overlaps.size === 0) {
        bestSolution = state;
      }
      // Otherwise, the next set of solutions will be considered. There can be up to four solutions per overlap
      // by the number of possible directions to move.
      else {
        nextSolutions.push(...findNextSolutions(state));
      }
    }

    moveSolutions = nextSolutions;

    safetyCounter--;
    if (safetyCounter <= 0) {
      throw new Error("Invariant violation: reached safety counter when resolving overlaps.");
    }
  }

  // When there are conflicts it is possible that there is not a single solution that can resolve all overlaps.
  // In that case the initial state is returned (with the user move performed).
  // This is totally expected and the next user move increment will likely resolve the conflicts and unblock
  // the overlaps resolution.
  if (!bestSolution) {
    return { grid: initialState.grid, moves: initialState.moves, conflicts: initialState.conflicts };
  }

  // After each step unless there are conflicts the "refloat" is performed which is performing type="FLOAT"
  // moves on all items that can be moved to the top without overlapping with other items.
  return bestSolution.conflicts.size > 0 ? bestSolution : refloatGrid(bestSolution, userMove);
}

// Find items that can "float" to the top and apply the necessary moves.
export function refloatGrid(layoutState: LayoutEngineStepState, userMove?: CommittedMove): LayoutEngineStepState {
  const state = new MoveSolutionState(layoutState.grid, layoutState.moves, layoutState.conflicts);

  function makeRefloat() {
    let needAnotherRefloat = false;

    for (const item of state.grid.items) {
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
        if (!validateVacantMove(state.grid, { ...move, y: move.y - 1 })) {
          break;
        }
      }
      if (item.y !== move.y) {
        makeMove(state, move, 0);
        needAnotherRefloat = true;
      }
    }

    if (needAnotherRefloat) {
      makeRefloat();
    }
  }

  makeRefloat();

  return { grid: state.grid, moves: state.moves, conflicts: state.conflicts };
}

class MoveSolutionState {
  public grid: LayoutEngineGrid;
  public moves: CommittedMove[];
  public conflicts: ReadonlySet<ItemId>;
  public overlaps: Set<ItemId>;
  public score: number;

  constructor(
    grid: ReadonlyLayoutEngineGrid,
    moves: readonly CommittedMove[],
    conflicts: ReadonlySet<ItemId> = new Set<ItemId>(),
    overlaps = new Set<ItemId>(),
    score = 0
  ) {
    this.grid = LayoutEngineGrid.clone(grid);
    this.moves = [...moves];
    this.conflicts = conflicts;
    this.overlaps = overlaps;
    this.score = score;
  }

  static clone({ grid, moves, conflicts, overlaps, score }: MoveSolutionState) {
    return {
      grid: LayoutEngineGrid.clone(grid),
      moves: [...moves],
      conflicts,
      overlaps: new Set([...overlaps]),
      score,
    };
  }
}

interface MoveSolution {
  state: MoveSolutionState;
  move: CommittedMove;
  moveScore: number;
}

function makeMove(state: MoveSolutionState, nextMove: CommittedMove, moveScore: number): void {
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

function findNextSolutions(state: MoveSolutionState): MoveSolution[] {
  const nextMoveSolutions: MoveSolution[] = [];

  for (const overlap of [...state.overlaps]) {
    if (state.conflicts.has(overlap)) {
      continue;
    }

    const directions: Direction[] = ["down", "left", "right", "up"];
    for (const moveDirection of directions) {
      const moveScore = getDirectionMoveScore(state, overlap, moveDirection);
      if (moveScore !== null) {
        const moveTarget = state.grid.getItem(overlap);
        const overlapIssuer = getOverlapWith(state.grid, moveTarget);
        const move = getMoveForDirection(moveTarget, overlapIssuer, moveDirection);
        nextMoveSolutions.push({ state: MoveSolutionState.clone(state), move, moveScore });
      }
    }
  }

  return nextMoveSolutions;
}

function getDirectionMoveScore(state: MoveSolutionState, overlap: ItemId, moveDirection: Direction): null | number {
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

// Finds items that cannot be resolved at the current step.
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
      throw new Error("Invariant violation: user move is not incremental");
  }

  return conflicts;
}
