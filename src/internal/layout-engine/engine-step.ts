// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position } from "../utils/position";
import { findNextSolutions, MoveSolution, MoveSolutionState } from "./engine-solution";
import { Conflicts, LayoutEngineState } from "./engine-state";
import { ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";
import { checkItemsIntersection, sortGridItems } from "./utils";
import { createMove } from "./utils";

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
  const initialSolution: MoveSolution = [initialState, userMove];

  // All solutions are guaranteed to have unique move sequences but different move sequences can produce the same result.
  // As it is never expected for one item to be moved over to the same location twice the combination of the item ID,
  // item position, and solution score can uniquely represent the solution.
  // For earlier moves taking a solution from the cache can prevent hundreds of subsequent computations.
  const solutionsCache = new Map<string, MoveSolution>();
  const createCacheKey = ([state, move]: MoveSolution) =>
    `${move.itemId} ${move.x}:${move.y}:${state.score + move.score}`;

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
      const [solutionState, solutionMove] = moveSolutions[solutionIndex];

      // Discard the solution before performing the move if its next score is already above the best score found so far.
      if (bestSolution && solutionState.score + solutionMove.score >= bestSolution.score) {
        continue;
      }

      // Perform the move by mutating the solution's state: grid, moves, score, etc.
      makeMove(solutionState, solutionMove);

      // If no overlaps are left the solution is considered valid and the best so far.
      // The next solutions having the same or higher score will be discarded.
      if (solutionState.overlaps.size === 0) {
        bestSolution = solutionState;
      }
      // Otherwise, the next set of solutions will be considered. There can be up to four solutions per overlap
      // (by the number of possible directions to move).
      else {
        for (const nextSolution of findNextSolutions(solutionState)) {
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
    moveSolutions = nextSolutions.sort((s1, s2) => s1[0].score + s1[1].score - (s2[0].score + s2[1].score));
    nextSolutions = [];

    // Reaching the convergence counter might indicate an issue with the algorithm as ideally it should converge faster.
    // However, that does not necessarily mean the logical problem and no exception should be thrown.
    // Instead, the current best solution if available applies or a simple solution is offered instead.
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
  // Move overlapping items to the bottom until resolved. Repeat until no overlaps left.
  // This solution always converges because there is always free space at the bottom by design.
  while (state.overlaps.size > 0) {
    const overlaps = sortGridItems([...state.overlaps].map(([overlapId]) => state.grid.getItem(overlapId)));
    for (const overlap of overlaps) {
      let y = overlap.y + 1;
      while (state.grid.getOverlaps({ ...overlap, y }).length > 0) {
        y++;
      }
      makeMove(state, createMove("OVERLAP", overlap, new Position({ x: overlap.x, y })));
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
        makeMove(state, move);
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

// Finds items that cannot be resolved at the current step as of being partially overlapped by the user-move item.
function findConflicts(
  grid: ReadonlyLayoutEngineGrid,
  previousConflicts: null | Conflicts,
  userMove: CommittedMove,
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

// Applies given move to the solution state by updating the grid, moves, overlaps, and score.
function makeMove(state: MoveSolutionState, nextMove: CommittedMove): void {
  updateGridWithMove(state, nextMove);
  updateOverlaps(state, nextMove);
  state.moves.push(nextMove);
  state.score += nextMove.score;
}

function updateGridWithMove({ grid }: MoveSolutionState, move: CommittedMove): void {
  switch (move.type) {
    case "MOVE":
    case "OVERLAP":
    case "FLOAT":
      return grid.move(move.itemId, move.x, move.y);
    case "INSERT":
      return grid.insert({ id: move.itemId, ...move });
    case "REMOVE":
      return grid.remove(move.itemId);
    case "RESIZE":
      return grid.resize(move.itemId, move.width, move.height);
  }
}

function updateOverlaps(state: MoveSolutionState, move: CommittedMove) {
  // Find and assign items that will overlap with the moved item after the move is performed
  // unless the overlapping items are considered as conflicts.
  for (const newOverlap of state.grid.getOverlaps({ ...move, id: move.itemId })) {
    if (!state.conflicts?.items.has(newOverlap.id)) {
      state.overlaps.set(newOverlap.id, move.itemId);
    }
  }
  // Remove no longer valid overlaps after the move is performed.
  for (const [overlapId, overlapIssuerId] of state.overlaps) {
    if (!checkItemsIntersection(state.grid.getItem(overlapId), state.grid.getItem(overlapIssuerId))) {
      state.overlaps.delete(overlapId);
    }
  }
}
