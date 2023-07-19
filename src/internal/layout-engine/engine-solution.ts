// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { Conflicts } from "./engine-state";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkOppositeDirections, createMove } from "./utils";

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
      const move = getDirectionMove(state, overlapId, overlapIssuerId, moveDirection);
      if (move !== null) {
        nextMoveSolutions.push([MoveSolutionState.clone(state), move]);
      }
    }
  }
  return nextMoveSolutions;
}

function getDirectionMove(
  state: MoveSolutionState,
  overlapId: ItemId,
  overlapIssuerId: ItemId,
  moveDirection: Direction
): null | CommittedMove {
  const activeId = state.moves[0].itemId;
  const overlapItem = state.grid.getItem(overlapId);
  const overlapIssuerItem = state.grid.getItem(overlapIssuerId);
  const move = getMoveForDirection(overlapItem, overlapIssuerItem, moveDirection);

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

  const prevOverlapMove = getLastSolutionMove(state, overlapItem.id);
  if (prevOverlapMove && checkOppositeDirections(prevOverlapMove.direction, moveDirection)) {
    return null;
  }

  const lastIssuerMove = getLastSolutionMove(state, overlapIssuerItem.id);
  if (!lastIssuerMove) {
    throw new Error("Invariant violation: overlap issuer has no associated moves.");
  }

  const activeItemMinY = getUserMinY(state);

  const startY = move.y <= overlapItem.y ? move.y : overlapItem.y + overlapItem.height;
  const endY = move.y < overlapItem.y ? overlapItem.y - 1 : move.y + overlapItem.height - 1;
  const startX = move.x <= overlapItem.x ? move.x : overlapItem.x + overlapItem.width;
  const endX = move.x < overlapItem.x ? overlapItem.x - 1 : move.x + overlapItem.width - 1;
  const pathRect = { id: move.itemId, x: startX, width: 1 + endX - startX, y: startY, height: 1 + endY - startY };
  // TODO: performance
  const pathOverlaps = state.grid
    .getOverlaps(pathRect)
    .filter((overlap) => (state.moves[0].type !== "INSERT" && overlap.id === activeId ? false : true));

  const { gradientX, gradientY } = getSolutionMovesGradient(state);

  const isVacant = pathOverlaps.length === 0;
  const isSwap = checkOppositeDirections(move.direction, lastIssuerMove.direction);
  const alternateDirectionPenalty = moveDirection !== lastIssuerMove.direction && !isSwap ? 10 : 0;
  const moveDistancePenalty = Math.abs(overlapItem.x - move.x) + Math.abs(overlapItem.y - move.y);
  // TODO: performance
  const overlapsPenalty =
    pathOverlaps
      .map((overlap) => (overlap.id === activeId && state.moves[0].type === "INSERT" ? 2 : 1))
      .reduce((sum, x) => sum + x, 0) * 50;
  const gradientXPenalty =
    (moveDirection === "left" && gradientX > 0) || (moveDirection === "right" && gradientX < 0) ? gradientX * 2 : 0;
  const gradientYPenalty =
    (moveDirection === "up" && gradientY > 0) || (moveDirection === "down" && gradientY < 0) ? gradientY * 2 : 0;
  const resizeUpPenalty = state.moves[0].type === "RESIZE" && moveDirection === "up" ? 1000 : 0;
  const resizeLeftPenalty = state.moves[0].type === "RESIZE" && moveDirection === "left" ? 50 : 0;
  const moveAboveActivePenalty = move.y + move.height - 1 < activeItemMinY ? 100 : 0;
  const withPenalties = (score: number) =>
    score +
    moveDistancePenalty +
    overlapsPenalty +
    alternateDirectionPenalty +
    gradientXPenalty +
    gradientYPenalty +
    resizeUpPenalty +
    resizeLeftPenalty +
    moveAboveActivePenalty;

  // TODO: use single formula
  let score = 0;
  if (isSwap && state.moves[0].type === "RESIZE") {
    score += withPenalties(200);
  } else if (isSwap && overlapIssuerItem.id === activeId) {
    score += withPenalties(10);
  } else if (isVacant && !isSwap) {
    score += withPenalties(20);
  } else if (isVacant && overlapIssuerItem.id !== activeId) {
    score += withPenalties(20);
  } else if (isVacant) {
    score += withPenalties(60);
  } else if (isSwap) {
    score += withPenalties(80);
  } else {
    score += withPenalties(50);
  }
  return { ...move, score };
}

// Retrieve the first possible move for the given direction to resolve the overlap.
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

// Calculates the minimal Y the user-controlled item crossed considering the original location and two previous moves.
// The board items above that boundary are not expected to be disturbed.
function getUserMinY(state: MoveSolutionState): number {
  const firstUserMove = state.moves[0];
  const lastUserMove = state.moves[state.moveIndex];
  if (!firstUserMove || !lastUserMove || firstUserMove.itemId !== lastUserMove.itemId) {
    throw new Error("Invariant violation: unexpected user move.");
  }
  return Math.min(firstUserMove.y - firstUserMove.distanceY, lastUserMove.y - lastUserMove.distanceY, lastUserMove.y);
}
