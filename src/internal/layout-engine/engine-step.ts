// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayoutItem, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { Conflicts, LayoutEngineState } from "./engine-state";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { sortGridItems } from "./utils";
import { checkItemsIntersection, createMove } from "./utils";

// TODO: property tests for convergence.
// TODO: validate existing property tests with 100_000 runs.

// The solutions can't be searched for infinitely in case the algorithm can't converge.
// The safety counter ensures there is going to be user feedback within reasonable time.
const MAX_SOLUTION_DEPTH = 100;

// At any given step only a few best solutions are taken to ensure faster convergence.
// The larger the number the better chance the most optimal solution is found for the given priorities
// at a cost of more computations made.
const NUM_BEST_SOLUTIONS = 5;

/**
 * The function takes the current layout state (item placements from the previous steps and all moves done so far)
 * and a user command increment that describes an item transition by one cell in some direction.
 * The function finds overlapping elements and resolves all overlaps if possible (always possible when no conflicts).
 * The result in an updated state (new item placements, additional moves, and item conflicts if any).
 */
export function resolveOverlaps(layoutState: LayoutEngineState, userMove: CommittedMove): LayoutEngineState {
  // For better UX the layout engine is optimized for item swaps.
  // The swapping is only preferred for the user-controlled item and it can only happen when the item overlaps another
  // item past its midpoint. When the overlap is not enough, the underlying item is considered a conflict and it is not
  // allowed to move anywhere. The user command cannot be committed at this step.
  const conflicts = findConflicts(layoutState.grid, layoutState.conflicts, userMove);

  // The user moves are always applied as is. When the user-controlled item overlaps with other items and there is
  // no conflict, the type="OVERLAP" moves are performed to settle the grid so that no items overlap with one another.
  // For this type of move multiple solutions are often available. To ensure the best result all solutions are tried
  // and a score is given to each. The solution with the minimal score wins.
  // The process stars from the initial state and the user move. The initial score and the user move score are 0.
  const initialState = new MoveSolutionState(layoutState.grid, layoutState.moves, conflicts);
  const initialSolution: MoveSolution = { state: initialState, move: userMove, moveScore: 0 };

  // All solutions are guaranteed to have unique move sequences but different move sequences can produce the same result.
  // As it is never expected for one item to be moved over to the same location twice the combination of the item ID,
  // item position, and solution score can uniquely represent the solution.
  // For earlier moves taking a solution from the cache can prevent hundreds of subsequent computations.
  const solutionsCache = new Map<string, MoveSolution>();
  const createCacheKey = ({ state, move, moveScore }: MoveSolution) =>
    `${move.itemId} ${move.x}:${move.y}:${state.score + moveScore}`;

  let moveSolutions: MoveSolution[] = [initialSolution];
  let bestSolution: null | MoveSolutionState = null;
  let convergenceCounter = MAX_SOLUTION_DEPTH;

  // The resolution process continues until there is at least one reasonable solution left.
  // The repetitive, dead-end, and expensive (compared to the best so far) solutions are excluded
  // so that eventually no more variants to try remain.
  // The convergence safety counter ensures the logical errors to not cause an infinite loop.
  while (moveSolutions.length > 0) {
    let nextSolutions: MoveSolution[] = [];

    for (let solutionIndex = 0; solutionIndex < Math.min(NUM_BEST_SOLUTIONS, moveSolutions.length); solutionIndex++) {
      const solution = moveSolutions[solutionIndex];

      // Discard the solution before performing the move if its next score is already above the best score found so far.
      if (bestSolution && solution.state.score + solution.moveScore >= bestSolution.score) {
        continue;
      }

      // Perform the move by mutating the solution's state: grid, moves, score, etc.
      makeMove(solution.state, solution.move, solution.moveScore);

      // If no overlaps are left the solution is considered valid and the best so far.
      // The next solutions having the same or higher score will be discarded.
      if (solution.state.overlaps.size === 0) {
        bestSolution = solution.state;
      }
      // Otherwise, the next set of solutions will be considered. There can be up to four solutions per overlap
      // (by the number of possible directions to move).
      else {
        const nextState = MoveSolutionState.clone(solution.state);
        for (const nextSolution of findNextSolutions(nextState)) {
          const solutionKey = createCacheKey(nextSolution);
          const cachedSolution = solutionsCache.get(solutionKey);
          if (!cachedSolution) {
            nextSolutions.push(nextSolution);
            solutionsCache.set(solutionKey, nextSolution);
          }
        }
      }
    }

    // The solutions are ordered by the total score so that the best (so far) solutions are considered first.
    moveSolutions = nextSolutions.sort((s1, s2) => s1.state.score + s1.moveScore - (s2.state.score + s2.moveScore));
    nextSolutions = [];

    // Reaching the convergence counter might indicate an issue with the algorithm as ideally it should converge faster.
    // However, that does not necessarily mean the logical problem and no exception should be thrown.
    // Instead, the current best solution if available applies. If no solution was found then the move
    // cannot be committed at the current step which is also fine.
    convergenceCounter--;
    if (convergenceCounter <= 0) {
      break;
    }
  }

  // If there are conflicts it might not be possible to find a solution as the items are not allowed to
  // overlap with the conflicts. In that case the initial state (with the user move applied) is returned.
  // The user can move the item further to resolve the conflicts which will also unblock the overlaps resolution.
  // Also, the solution might not be found due to the engine constraints. For example, the convergence number might
  // be reached before any solution is found or the number of best solutions constraint can filter the only possible
  // solutions away. In that case the simple solution is returned with all overlapping items pushed to the bottom.
  if (!bestSolution) {
    bestSolution = initialState.conflicts ? initialState : resolveOverlapsDown(initialState);
  }

  // After each step unless there are conflicts the type="FLOAT" moves are performed on all items
  // but the user controlled one that can be moved to the top without overlapping with other items.
  return bestSolution.conflicts ? bestSolution : refloatGrid(bestSolution, userMove);
}

// Resolves overlaps the simple way by pushing all overlapping items to the bottom until none is left.
function resolveOverlapsDown(state: MoveSolutionState): MoveSolutionState {
  state = MoveSolutionState.clone(state);

  while (state.overlaps.size > 0) {
    const overlaps = sortGridItems([...state.overlaps].map(([overlapId]) => state.grid.getItem(overlapId)));
    for (const overlap of overlaps) {
      let y = overlap.y + 1;
      while (state.grid.getOverlaps({ ...overlap, y }).length > 0) {
        y++;
      }
      makeMove(state, createMove("OVERLAP", overlap, new Position({ x: overlap.x, y })), 0);
    }
  }

  return state;
}

// Find items that can "float" to the top and apply the necessary moves.
function refloatGrid(layoutState: LayoutEngineState, userMove?: CommittedMove): LayoutEngineState {
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
        if (state.grid.getOverlaps({ id: item.id, ...moveAttempt }).length > 0) {
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

  return state;
}

// TODO: compute gradientX, gradientY, and score in the getDirectionMoveScore
class MoveSolutionState {
  public grid: LayoutEngineGrid;
  public moves: CommittedMove[];
  public moveIndex = 0;
  public gradientX = 0;
  public gradientY = 0;
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
    this.moveIndex = moves.length;
    this.conflicts = conflicts;
    this.overlaps = overlaps;
    this.score = score;
  }

  static clone({ grid, moves, moveIndex, gradientX, gradientY, conflicts, overlaps, score }: MoveSolutionState) {
    return {
      grid: LayoutEngineGrid.clone(grid),
      moves: [...moves],
      moveIndex,
      gradientX,
      gradientY,
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
  switch (nextMove.type) {
    case "MOVE":
    case "OVERLAP":
    case "FLOAT":
      state.grid.move(nextMove.itemId, nextMove.x, nextMove.y);
      break;
    case "INSERT":
      state.grid.insert({ id: nextMove.itemId, ...nextMove });
      break;
    case "REMOVE":
      state.grid.remove(nextMove.itemId);
      break;
    case "RESIZE":
      state.grid.resize(nextMove.itemId, nextMove.width, nextMove.height);
      break;
  }
  state.moves.push(nextMove);
  for (const newOverlap of state.grid.getOverlaps({ ...nextMove, id: nextMove.itemId })) {
    if (!state.conflicts?.items.has(newOverlap.id)) {
      state.overlaps.set(newOverlap.id, nextMove.itemId);
    }
  }
  state.overlaps.delete(nextMove.itemId);
  state.score += moveScore;
  state.gradientX +=
    nextMove.type === "OVERLAP"
      ? (nextMove.direction === "left" || nextMove.direction === "right" ? nextMove.distance : 0) * nextMove.height
      : 0;
  state.gradientY +=
    nextMove.type === "OVERLAP"
      ? (nextMove.direction === "up" || nextMove.direction === "down" ? nextMove.distance : 0) * nextMove.width
      : 0;
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

  let prevOverlapMove: null | CommittedMove = null;
  for (let i = state.moves.length - 1; i >= state.moveIndex; i--) {
    if (state.moves[i].itemId === overlap) {
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
  const moveDistancePenalty = Math.abs(moveTarget.x - move.x) + Math.abs(moveTarget.y - move.y);
  const overlapsPenalty =
    pathOverlaps
      .map((overlap) => (overlap.id === activeId && state.moves[0].type === "INSERT" ? 2 : 1))
      .reduce((sum, x) => sum + x, 0) * 50;
  const gradientXPenalty =
    (moveDirection === "left" && state.gradientX > 0) || (moveDirection === "right" && state.gradientX < 0)
      ? state.gradientX * 2
      : 0;
  const gradientYPenalty =
    (moveDirection === "up" && state.gradientY > 0) || (moveDirection === "down" && state.gradientY < 0)
      ? state.gradientY * 2
      : 0;
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

// Finds items that cannot be resolved at the current step as of being partially overlapped by the user-move item.
function findConflicts(
  grid: ReadonlyLayoutEngineGrid,
  previousConflicts: null | Conflicts,
  userMove: CommittedMove
): null | Conflicts {
  // The conflicts are only defined for MOVE command type to make swaps possible.
  if (userMove.type !== "MOVE") {
    return null;
  }
  // Using existing conflict direction if available so that conflicting items would swap consistently.
  // If only the current direction is considered the multi-item conflicts become difficult to comprehend.
  const direction = previousConflicts?.direction ?? userMove.direction;
  // Conflicts are partial overlaps. When the item is overlapped fully (considering the direction) it is
  // no longer treated as conflict.
  const overlaps = grid.getOverlaps({ ...userMove, id: userMove.itemId });
  const conflicts = overlaps.filter((overlap) => {
    switch (direction) {
      case "left":
        return overlap.x < userMove.x;
      case "right":
        return overlap.x + overlap.width - 1 > userMove.x + userMove.width - 1;
      case "up":
        return overlap.y < userMove.y;
      case "down":
        return overlap.y + overlap.height - 1 > userMove.y + userMove.height - 1;
    }
  });
  if (conflicts.length > 0) {
    return { direction, items: new Set(conflicts.map((item) => item.id)) };
  }
  return null;
}
