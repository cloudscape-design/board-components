// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { Conflicts } from "./engine-state";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkOppositeDirections, createMove, getMoveOriginalRect, getMoveRect } from "./utils";

// TODO: property tests for convergence.
// TODO: validate existing property tests with 100_000 runs.

// All directions in which overlaps can be incrementally resolved.
const PRIORITY_DIRECTIONS: readonly Direction[] = ["down", "right", "left", "up"];

// A valid but not yet attempted solution is a pair of the layout state so far and the next move to attempt.
// The minimal solution score (in case the next move will resolve all overlaps) is state.score + nextMove.score.
export type MoveSolution = [state: MoveSolutionState, nextMove: CommittedMove];

// The class represents an intermediate layout state used to find the next set of solutions for.
// The solution is terminal when no overlaps are left and it can become the next layout state if its
// score is smaller than that of the alternative solutions.
export class MoveSolutionState {
  public grid: LayoutEngineGrid;
  public moves: CommittedMove[];
  public moveIndex = 0;
  public conflicts: null | Conflicts;
  public overlaps = new Map<ItemId, ItemId>();
  public score = 0;

  constructor(grid: ReadonlyLayoutEngineGrid, moves: readonly CommittedMove[], conflicts: null | Conflicts) {
    this.grid = LayoutEngineGrid.clone(grid);
    this.moves = [...moves];
    this.moveIndex = moves.length;
    this.conflicts = conflicts;
  }

  // The solution state needs to be cloned after the move is performed in case there are overlaps left
  // so that the next solutions won't have the shared state to corrupt.
  // The conflicts never change and can be carried over w/o cloning.
  static clone({ grid, moves, moveIndex, conflicts, overlaps, score }: MoveSolutionState) {
    return {
      grid: LayoutEngineGrid.clone(grid),
      moves: [...moves],
      moveIndex,
      conflicts,
      overlaps: new Map([...overlaps]),
      score,
    };
  }
}

/**
 * Given a solution state finds a set of all possible moves each resolving a particular overlap.
 */
export function findNextSolutions(state: MoveSolutionState): MoveSolution[] {
  // For every overlap and direction found a move if exists that resolves the overlap.
  // A pair of the given state and the overlap resolution move is a new solution to try.
  const nextMoveSolutions: MoveSolution[] = [];
  for (const [overlapId, overlapIssuerId] of state.overlaps) {
    for (const moveDirection of PRIORITY_DIRECTIONS) {
      const move = getOverlapMove(state, overlapId, overlapIssuerId, moveDirection);
      if (move !== null) {
        nextMoveSolutions.push([MoveSolutionState.clone(state), move]);
      }
    }
  }
  return nextMoveSolutions;
}

// Returns an evaluated move to resolve the given overlap in the given direction or null if such move is not possible.
function getOverlapMove(
  state: MoveSolutionState,
  overlapId: ItemId,
  overlapIssuerId: ItemId,
  moveDirection: Direction
): null | CommittedMove {
  const userItem = state.grid.getItem(state.moves[0].itemId);
  const overlapItem = state.grid.getItem(overlapId);
  const overlapIssuerItem = state.grid.getItem(overlapIssuerId);
  const overlapMove = getMoveForDirection(overlapItem, overlapIssuerItem, moveDirection);

  // The move position is outside the grid boundaries.
  if (overlapMove.x < 0 || overlapMove.y < 0 || overlapMove.x + overlapMove.width > state.grid.width) {
    return null;
  }

  // Subsequent item overlap moves in the opposite directions do not contribute to solution.
  const prevOverlapMove = getLastSolutionMove(state, overlapItem.id);
  if (prevOverlapMove && checkOppositeDirections(prevOverlapMove.direction, moveDirection)) {
    return null;
  }

  const pathOverlaps = getPathOverlaps(state, overlapMove, overlapIssuerItem);
  for (const overlap of pathOverlaps) {
    // Not allowed to intersect with the user-controlled item.
    if (overlap.id === userItem.id) {
      return null;
    }
    // Not allowed to intersect with conflicting items.
    if (state.conflicts?.items.has(overlap.id)) {
      return null;
    }
    // Intersecting with items having unresolved overlaps does not contribute to solution.
    if (state.overlaps.has(overlap.id)) {
      return null;
    }
  }

  const lastIssuerMove = getLastSolutionMove(state, overlapIssuerItem.id);
  if (!lastIssuerMove) {
    throw new Error("Invariant violation: overlap issuer has no associated moves.");
  }

  // Boundaries score penalize movements of items that are outside the area covered by the user move.
  const userMoveBoundaries = getUserMoveBoundaries(state);
  const moveOutsideUserTopPenalty = overlapItem.y + overlapItem.height - 1 < userMoveBoundaries.top ? 500 : 0;
  const moveOutsideUserLeftPenalty = overlapItem.x + overlapItem.width - 1 < userMoveBoundaries.left ? 50 : 0;
  const moveOutsideUserRightPenalty = overlapItem.x > userMoveBoundaries.right ? 50 : 0;
  const boundariesScore = moveOutsideUserTopPenalty + moveOutsideUserLeftPenalty + moveOutsideUserRightPenalty;

  // Gradient score penalize movements that are against the common move direction of other items.
  const { gradientX, gradientY } = getSolutionMovesGradient(state);
  const gradientXPenalty =
    (moveDirection === "left" && gradientX > 0) || (moveDirection === "right" && gradientX < 0) ? gradientX * 2 : 0;
  const gradientYPenalty =
    (moveDirection === "up" && gradientY > 0) || (moveDirection === "down" && gradientY < 0) ? gradientY * 2 : 0;
  const gradientScore = gradientXPenalty + gradientYPenalty;

  const isVacant = pathOverlaps.size === 0;
  const isSwap = checkIfSwap(overlapMove, lastIssuerMove);

  const alternateDirectionPenalty = !isSwap && moveDirection !== lastIssuerMove.direction ? 10 : 0;
  const moveDistancePenalty = Math.abs(overlapItem.x - overlapMove.x) + Math.abs(overlapItem.y - overlapMove.y);
  const overlapsPenalty = pathOverlaps.size * 50;

  const penalties = moveDistancePenalty + overlapsPenalty + alternateDirectionPenalty + gradientScore + boundariesScore;

  // TODO: use single formula
  let score = 0;
  if (isSwap && overlapIssuerItem.id === userItem.id) {
    score += 10 + penalties;
  } else if (isVacant && !isSwap) {
    score += 20 + penalties;
  } else if (isVacant && overlapIssuerItem.id !== userItem.id) {
    score += 20 + penalties;
  } else if (isVacant) {
    score += 60 + penalties;
  } else {
    score += penalties;
  }
  return { ...overlapMove, score };
}

// Retrieves the first possible move for the given direction to resolve the overlap.
function getMoveForDirection(moveTarget: GridLayoutItem, overlap: GridLayoutItem, direction: Direction): CommittedMove {
  switch (direction) {
    case "up":
      return createMove("OVERLAP", moveTarget, new Position({ x: moveTarget.x, y: overlap.y - moveTarget.height }));
    case "down":
      return createMove("OVERLAP", moveTarget, new Position({ x: moveTarget.x, y: overlap.y + overlap.height }));
    case "left":
      return createMove("OVERLAP", moveTarget, new Position({ x: overlap.x - moveTarget.width, y: moveTarget.y }));
    case "right":
      return createMove("OVERLAP", moveTarget, new Position({ x: overlap.x + overlap.width, y: moveTarget.y }));
  }
}

// Retrieves the last move if exists within the given solution.
function getLastSolutionMove(state: MoveSolutionState, itemId: ItemId): null | CommittedMove {
  let lastMove: null | CommittedMove = null;
  for (let i = state.moves.length - 1; i >= state.moveIndex; i--) {
    if (state.moves[i].itemId === itemId) {
      lastMove = state.moves[i];
      break;
    }
  }
  return lastMove;
}

// Calculates X, Y gradients as the amount of cell movements to either direction.
// All moves in one direction are summarized, the opposite moves cancel each other.
// The gradients show in which direction (left / right, up / down) the most overlaps were resolved.
function getSolutionMovesGradient(state: MoveSolutionState): { gradientX: number; gradientY: number } {
  let gradientX = 0;
  let gradientY = 0;
  for (let i = state.moveIndex; i < state.moves.length; i++) {
    const move = state.moves[i];
    if (move.type === "OVERLAP") {
      gradientX += move.distanceX * move.height;
      gradientY += move.distanceY * move.width;
    }
  }
  return { gradientX, gradientY };
}

// Finds a rectangle within which the user-controlled item was moved.
// The rectangle only considers the original item location and the last two moves performed.
// The layout items outside the boundaries are not expected to be disturbed.
function getUserMoveBoundaries(state: MoveSolutionState): { top: number; right: number; bottom: number; left: number } {
  const firstUserMove = state.moves[0];
  const lastUserMove = state.moves[state.moveIndex];
  if (!firstUserMove || !lastUserMove || firstUserMove.itemId !== lastUserMove.itemId) {
    throw new Error("Invariant violation: unexpected user move.");
  }
  const r1 = getMoveOriginalRect(firstUserMove);
  const r2 = getMoveOriginalRect(lastUserMove);
  const r3 = getMoveRect(lastUserMove);
  return {
    top: Math.min(r1.top, r2.top, r3.top),
    right: Math.max(r1.right, r2.right, r3.right),
    bottom: Math.max(r1.bottom, r2.bottom, r3.bottom),
    left: Math.min(r1.left, r2.left, r3.left),
  };
}

// Finds all overlaps that the move will cause along its path not considering the original location and original overlap.
function getPathOverlaps(
  state: MoveSolutionState,
  move: CommittedMove,
  overlapIssuerItem: GridLayoutItem
): Set<GridLayoutItem> {
  const { left, right, top, bottom } = getMoveOriginalRect(move);
  const startX = move.distanceX <= 0 ? move.x : right + 1;
  const endX = move.distanceX < 0 ? left - 1 : right + move.distanceX;
  const startY = move.distanceY <= 0 ? move.y : bottom + 1;
  const endY = move.distanceY < 0 ? top - 1 : bottom + move.distanceY;

  const pathOverlaps = new Set(
    state.grid.getOverlaps({
      id: move.itemId,
      x: startX,
      width: 1 + endX - startX,
      y: startY,
      height: 1 + endY - startY,
    })
  );
  pathOverlaps.delete(overlapIssuerItem);

  return pathOverlaps;
}

// Checks if the overlap move is a swap with the user-moved item.
function checkIfSwap(overlapMove: CommittedMove, lastIssuerMove: CommittedMove): boolean {
  if (lastIssuerMove.type !== "MOVE") {
    return false;
  }
  if (!checkOppositeDirections(overlapMove.direction, lastIssuerMove.direction)) {
    return false;
  }
  const overlapRect = getMoveOriginalRect(overlapMove);
  const issuerRect = getMoveRect(lastIssuerMove);
  switch (lastIssuerMove.direction) {
    case "up":
      return overlapRect.top === issuerRect.top;
    case "right":
      return overlapRect.right === issuerRect.right;
    case "down":
      return overlapRect.bottom === issuerRect.bottom;
    case "left":
      return overlapRect.left === issuerRect.left;
  }
}
