// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkItemsIntersection, createMove } from "./utils";

// TODO: many more property tests
// TODO: store overlaps in grid to not re-compute unnecessarily

/**
 * The user commands in the layout engine are applied step by step.
 * The class describes the layout engine state at a particular step.
 * The state of the last performed state describes the command result.
 */
export class LayoutEngineStepState {
  public grid: ReadonlyLayoutEngineGrid;
  public moves: readonly CommittedMove[];
  public conflicts: null | Conflicts;

  constructor(grid: LayoutEngineGrid, moves = new Array<CommittedMove>(), conflicts: null | Conflicts = null) {
    this.grid = grid;
    this.moves = moves;
    this.conflicts = conflicts;
  }
}

export interface Conflicts {
  items: ReadonlySet<ItemId>;
  direction: Direction;
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
  const conflicts = findConflicts(layoutState.grid, layoutState.conflicts, userMove);

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

    for (const { state: moveState, move, moveScore } of moveSolutions) {
      // Discard the solution before performing the move if its next score is already above the best score found so far.
      if (bestSolution && moveState.score + moveScore >= bestSolution.score) {
        continue;
      }

      const state = MoveSolutionState.clone(moveState);

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
        for (const solution of findNextSolutions(state)) {
          nextSolutions.push(solution);
        }
      }
    }

    moveSolutions = nextSolutions
      .sort((s1, s2) => s1.state.score + s1.moveScore - (s2.state.score + s2.moveScore))
      .slice(0, 10);

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
  return bestSolution.conflicts ? bestSolution : refloatGrid(bestSolution, userMove);
}

// Find items that can "float" to the top and apply the necessary moves.
export function refloatGrid(layoutState: LayoutEngineStepState, userMove?: CommittedMove): LayoutEngineStepState {
  if (layoutState.conflicts) {
    return layoutState;
  }

  const state = new MoveSolutionState(layoutState.grid, layoutState.moves, layoutState.conflicts);

  function makeRefloat() {
    let needAnotherRefloat = false;

    for (const item of state.grid.items) {
      // The active item is skipped until the operation is committed.
      if (item.id === userMove?.itemId) {
        continue;
      }

      let y = item.y - 1;
      let move: null | CommittedMove = null;
      while (y >= 0) {
        const moveAttempt = createMove("FLOAT", item, new Position({ x: item.x, y }));
        if (!validateFloatMove(state.grid, moveAttempt)) {
          break;
        }
        y--;
        move = moveAttempt;
      }
      if (move) {
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
  public conflicts: null | Conflicts;
  public overlaps: Map<ItemId, ItemId>;
  public score: number;

  constructor(
    grid: ReadonlyLayoutEngineGrid,
    moves: readonly CommittedMove[],
    conflicts: null | Conflicts = null,
    overlaps = new Map<ItemId, ItemId>(),
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
      overlaps: new Map([...overlaps]),
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
  const addOverlap = (itemId: ItemId, issuerId: ItemId) => {
    if (!state.conflicts?.items.has(itemId)) {
      state.overlaps.set(itemId, issuerId);
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

  for (const [overlap, overlapIssuer] of state.overlaps) {
    if (!checkItemsIntersection(state.grid.getItem(overlap), state.grid.getItem(overlapIssuer))) {
      state.overlaps.delete(overlap);
      continue;
    }

    const directions: Direction[] = ["down", "left", "right", "up"];
    for (const moveDirection of directions) {
      const moveScore = getDirectionMoveScore(state, overlap, overlapIssuer, moveDirection);
      if (moveScore !== null) {
        const moveTarget = state.grid.getItem(overlap);
        const move = getMoveForDirection(moveTarget, state.grid.getItem(overlapIssuer), moveDirection);
        nextMoveSolutions.push({ state, move, moveScore });
      }
    }
  }

  return nextMoveSolutions;
}

function getDirectionMoveScore(
  state: MoveSolutionState,
  overlap: ItemId,
  issuer: ItemId,
  moveDirection: Direction
): null | number {
  const activeId = state.moves[0].itemId;
  const moveTarget = state.grid.getItem(overlap);
  const overlapIssuer = state.grid.getItem(issuer);
  const move = getMoveForDirection(moveTarget, overlapIssuer, moveDirection);

  // Outside the grid.
  if (move.x < 0 || move.y < 0 || move.x + move.width > state.grid.width) {
    return null;
  }

  for (const ov of state.grid.getOverlaps({ ...move, id: move.itemId })) {
    // Can't overlap with cells containing unresolved overlaps.
    if (state.overlaps.has(ov.id)) {
      return null;
    }
    // Can't overlap with the active item.
    if (ov.id === activeId) {
      return null;
    }
    // Can't overlap with the conflicted item.
    if (state.conflicts?.items.has(ov.id)) {
      return null;
    }
  }

  // const pathOverlaps = new Set<ItemId>();

  const startY = move.y <= moveTarget.y ? move.y : moveTarget.y + moveTarget.height;
  const endY = move.y < moveTarget.y ? moveTarget.y - 1 : move.y + moveTarget.height - 1;
  const startX = move.x <= moveTarget.x ? move.x : moveTarget.x + moveTarget.width;
  const endX = move.x < moveTarget.x ? moveTarget.x - 1 : move.x + moveTarget.width - 1;
  const pathRect = { id: move.itemId, x: startX, width: 1 + endX - startX, y: startY, height: 1 + endY - startY };
  const pathOverlaps = state.grid
    .getOverlaps(pathRect)
    .filter((overlap) => (state.moves[0].type !== "INSERT" && overlap.id === activeId ? false : true));

  let lastIssuerMove: null | CommittedMove = null;
  for (let i = state.moves.length - 1; i >= 0; i--) {
    if (state.moves[i].itemId === overlapIssuer.id) {
      lastIssuerMove = state.moves[i];
      break;
    }
  }
  const issuerMoveDirection = lastIssuerMove?.direction ?? null;

  const isVacant = pathOverlaps.length === 0;
  const isSwap = checkItemsSwap(state.moves, overlapIssuer, move, moveTarget);
  const alternateDirectionPenalty = issuerMoveDirection && moveDirection !== issuerMoveDirection && !isSwap ? 10 : 0;
  const repetitiveMovePenalty =
    overlapIssuer.id === activeId && isSwap
      ? 0
      : state.moves.filter((m) => m.itemId === overlap && m.direction !== moveDirection).length * (isVacant ? 10 : 25);
  const moveDistancePenalty = Math.abs(moveTarget.x - move.x) + Math.abs(moveTarget.y - move.y);
  const overlapsPenalty =
    pathOverlaps
      .map((overlap) => (overlap.id === activeId && state.moves[0].type === "INSERT" ? 2 : 1))
      .reduce((sum, x) => sum + x, 0) * 50;
  const withPenalties = (score: number) =>
    score + repetitiveMovePenalty + moveDistancePenalty + overlapsPenalty + alternateDirectionPenalty;

  if (isSwap && state.moves[0].type === "RESIZE") {
    return withPenalties(200);
  }
  if (isSwap && overlapIssuer.id === activeId) {
    return withPenalties(10);
  }
  if (isVacant && !isSwap) {
    return withPenalties(20);
  }
  if (isVacant && overlapIssuer.id !== activeId) {
    return withPenalties(20);
  }
  if (isVacant) {
    return withPenalties(60);
  }
  if (isSwap) {
    return withPenalties(80);
  }
  return withPenalties(50);
}

function validateFloatMove(grid: LayoutEngineGrid, move: CommittedMove): boolean {
  return grid.getOverlaps({ id: move.itemId, ...move }).length === 0;
}

function checkItemsSwap(
  moves: CommittedMove[],
  issuer: GridLayoutItem,
  move: CommittedMove,
  moveTarget: GridLayoutItem
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

function getLastStepDiff(moves: CommittedMove[], issuer: GridLayoutItem) {
  const issuerMoves = moves.filter((move) => move.itemId === issuer.id);
  const last = issuerMoves[issuerMoves.length - 1];
  if (!last) {
    return { x: 0, y: 0 };
  }
  return {
    x: last.direction === "left" || last.direction === "right" ? last.distance : 0,
    y: last.direction === "up" || last.direction === "down" ? last.distance : 0,
  };
}

// Retrieve first possible move for the given direction to resolve the overlap.
function getMoveForDirection(moveTarget: GridLayoutItem, overlap: GridLayoutItem, direction: Direction): CommittedMove {
  switch (direction) {
    case "up": {
      return createMove("OVERLAP", moveTarget, new Position({ x: moveTarget.x, y: overlap.y - moveTarget.height }));
    }
    case "down": {
      return createMove("OVERLAP", moveTarget, new Position({ x: moveTarget.x, y: overlap.y + overlap.height }));
    }
    case "left": {
      return createMove("OVERLAP", moveTarget, new Position({ x: overlap.x - moveTarget.width, y: moveTarget.y }));
    }
    case "right": {
      return createMove("OVERLAP", moveTarget, new Position({ x: overlap.x + overlap.width, y: moveTarget.y }));
    }
  }
}

// Finds items that cannot be resolved at the current step.
function findConflicts(
  grid: ReadonlyLayoutEngineGrid,
  previousConflicts: null | Conflicts,
  move: CommittedMove
): null | Conflicts {
  if (move.type !== "MOVE") {
    return null;
  }

  const conflicts = new Set<ItemId>();
  const moveTarget = grid.getItem(move.itemId);
  const direction: Direction = (() => {
    if (previousConflicts) {
      return previousConflicts.direction;
    }

    switch (`${move.x - moveTarget.x}:${move.y - moveTarget.y}`) {
      case "-1:0":
        return "left";
      case "1:0":
        return "right";
      case "0:-1":
        return "up";
      case "0:1":
        return "down";
      default:
        throw new Error("Invariant violation: user move is not incremental");
    }
  })();

  const overlaps = grid.getOverlaps({ ...move, id: move.itemId });

  for (const overlap of overlaps) {
    switch (direction) {
      case "left": {
        const left = move.x;
        if (overlap.x < left) {
          conflicts.add(overlap.id);
        }
        break;
      }
      case "right": {
        const right = move.x + move.width - 1;
        if (overlap.x + overlap.width - 1 > right) {
          conflicts.add(overlap.id);
        }
        break;
      }
      case "up": {
        const top = move.y;
        if (overlap.y < top) {
          conflicts.add(overlap.id);
        }
        break;
      }
      case "down": {
        const bottom = move.y + move.height - 1;
        if (overlap.y + overlap.height - 1 > bottom) {
          conflicts.add(overlap.id);
        }
        break;
      }
    }
  }

  return conflicts.size > 0 ? { items: conflicts, direction } : null;
}
