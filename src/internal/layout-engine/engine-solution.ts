// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { Conflicts } from "./engine-state";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkItemsIntersection, createMove } from "./utils";

// TODO: property tests for convergence.
// TODO: validate existing property tests with 100_000 runs.

const PRIORITY_DIRECTIONS: readonly Direction[] = ["down", "left", "right", "up"];

export type MoveSolution = [MoveSolutionState, CommittedMove];

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

export function findNextSolutions(state: MoveSolutionState): MoveSolution[] {
  const nextMoveSolutions: MoveSolution[] = [];

  for (const [overlapId, overlapIssuerId] of state.overlaps) {
    const overlapItem = state.grid.getItem(overlapId);
    const overlapIssuerItem = state.grid.getItem(overlapIssuerId);

    if (!checkItemsIntersection(overlapItem, overlapIssuerItem)) {
      state.overlaps.delete(overlapId);
      continue;
    }

    for (const moveDirection of PRIORITY_DIRECTIONS) {
      const move = getDirectionMove(state, overlapItem, overlapIssuerItem, moveDirection);
      if (move !== null) {
        nextMoveSolutions.push([state, move]);
      }
    }
  }

  return nextMoveSolutions;
}

function getDirectionMove(
  state: MoveSolutionState,
  overlapItem: GridLayoutItem,
  overlapIssuerItem: GridLayoutItem,
  moveDirection: Direction
): null | CommittedMove {
  const activeId = state.moves[0].itemId;
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

  let prevOverlapMove: null | CommittedMove = null;
  for (let i = state.moves.length - 1; i >= state.moveIndex; i--) {
    if (state.moves[i].itemId === overlapItem.id) {
      prevOverlapMove = state.moves[i];
    }
  }
  if (
    prevOverlapMove &&
    ((prevOverlapMove.direction === "down" && moveDirection === "up") ||
      (prevOverlapMove.direction === "up" && moveDirection === "down") ||
      (prevOverlapMove.direction === "left" && moveDirection === "right") ||
      (prevOverlapMove.direction === "right" && moveDirection === "left"))
  ) {
    return null;
  }

  const activeItemOriginalY =
    state.moves[0].direction === "down" ? state.moves[0].y - state.moves[0].distance : state.moves[0].y;
  const activeItemMoves = state.moves.filter((move) => move.itemId === activeId);
  const activeItemLastY = activeItemMoves[activeItemMoves.length - 1].y;
  const activeItemMinY = Math.min(activeItemOriginalY, activeItemLastY);

  const startY = move.y <= overlapItem.y ? move.y : overlapItem.y + overlapItem.height;
  const endY = move.y < overlapItem.y ? overlapItem.y - 1 : move.y + overlapItem.height - 1;
  const startX = move.x <= overlapItem.x ? move.x : overlapItem.x + overlapItem.width;
  const endX = move.x < overlapItem.x ? overlapItem.x - 1 : move.x + overlapItem.width - 1;
  const pathRect = { id: move.itemId, x: startX, width: 1 + endX - startX, y: startY, height: 1 + endY - startY };
  const pathOverlaps = state.grid
    .getOverlaps(pathRect)
    .filter((overlap) => (state.moves[0].type !== "INSERT" && overlap.id === activeId ? false : true));

  let lastIssuerMove: null | CommittedMove = null;
  for (let i = state.moves.length - 1; i >= 0; i--) {
    if (state.moves[i].itemId === overlapIssuerItem.id) {
      lastIssuerMove = state.moves[i];
      break;
    }
  }
  const issuerMoveDirection = lastIssuerMove?.direction ?? null;

  let gradientX = 0;
  let gradientY = 0;
  for (let i = state.moveIndex; i < state.moves.length; i++) {
    const move = state.moves[i];
    if (move.type === "OVERLAP") {
      gradientX += (move.direction === "left" || move.direction === "right" ? move.distance : 0) * move.height;
      gradientY += (move.direction === "up" || move.direction === "down" ? move.distance : 0) * move.width;
    }
  }

  const isVacant = pathOverlaps.length === 0;
  const isSwap = checkItemsSwap(state.moves, overlapIssuerItem, move, overlapItem);
  const alternateDirectionPenalty = issuerMoveDirection && moveDirection !== issuerMoveDirection && !isSwap ? 10 : 0;
  const moveDistancePenalty = Math.abs(overlapItem.x - move.x) + Math.abs(overlapItem.y - move.y);
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
