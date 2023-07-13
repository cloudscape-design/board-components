// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, ItemId } from "../interfaces";
import { LayoutEngineGrid, LayoutEngineItem, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";

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

export function resolveOverlaps(userMove: CommittedMove, state: LayoutEngineStepState): LayoutEngineStepState {
  return new LayoutEngineStep(state).resolveOverlaps(userMove).getState();
}

export function refloatGrid(state: LayoutEngineStepState): LayoutEngineStepState {
  return new LayoutEngineStep(state).refloatGrid().getState();
}

interface MoveVariantState {
  grid: LayoutEngineGrid;
  moves: CommittedMove[];
  overlaps: Set<ItemId>;
  score: number;
}

interface MoveVariant {
  state: MoveVariantState;
  move: CommittedMove;
  moveScore: number;
}

function cloneMoveVariantState({ grid, moves, overlaps, score }: MoveVariantState): MoveVariantState {
  return { grid: LayoutEngineGrid.clone(grid), moves: [...moves], overlaps: new Set([...overlaps]), score };
}

class LayoutEngineStep {
  private grid: LayoutEngineGrid;
  private moves: CommittedMove[] = [];
  private conflicts = new Set<ItemId>();

  constructor(state: LayoutEngineStepState) {
    this.grid = LayoutEngineGrid.clone(state.grid);
    this.moves = [...state.moves];
    this.conflicts = new Set([...state.conflicts]);
  }

  getState(): LayoutEngineStepState {
    return { grid: this.grid, moves: this.moves, conflicts: this.conflicts };
  }

  /**
    CALCULATED MOVES: 

    If no overlaps and no conflicts - refloat and exit
    If no overlaps - exit
    If overlaps:
      Consider each overlap+direction (a valid move) as an opportunity
      Calculate for each opportunity until it gets too expensive or no overlaps left
      A cost of an opportunity is a sum of step costs
      Vacant moves and priority moves can have different costs (easy to adjust)
      Escape moves are no longer possible - those have infinite cost (prop testing to confirm)
      Items are allowed to move multiple times but secondary priority moves are expensive
      If within a single opportunity calculation any two moves are equal - exit, there is an infinite loop
      The search algorithm is breadth-based (queue) to ensure no infinite loops
        The algorithm can be layered (make 1st move for all opportunities, make 2nd move for all new/remaining opportunities etc.)
      There is a safety counter for double-safety
    Test with extreme examples (6x20 board with many items) and ensure the algorithm never takes too long.
   */

  // Issue moves on overlapping items trying to resolve all of them.
  public resolveOverlaps(userMove: CommittedMove): LayoutEngineStep {
    this.conflicts = this.findConflicts(this.grid, userMove);

    const initialState = cloneMoveVariantState({ grid: this.grid, moves: this.moves, overlaps: new Set(), score: 0 });
    let moveVariants: MoveVariant[] = [{ state: initialState, move: userMove, moveScore: 0 }];

    let bestVariant: null | MoveVariantState = null;
    let safetyCounter = 10;

    while (moveVariants.length > 0) {
      const nextVariants: MoveVariant[] = [];

      for (const { state, move, moveScore } of moveVariants) {
        if (bestVariant && state.score + moveScore >= bestVariant.score) {
          continue;
        }

        this.makeMove(state, move, moveScore);

        if (state.overlaps.size === 0) {
          bestVariant = state;
        } else {
          nextVariants.push(...this.findNextVariants(state, userMove));
        }
      }

      moveVariants = nextVariants;

      console.log(nextVariants);

      safetyCounter--;
      if (safetyCounter <= 0) {
        throw new Error("Invariant violation: reached safety counter.");
      }
    }

    if (!bestVariant) {
      return this;
    }

    this.grid = bestVariant.grid;
    this.moves = bestVariant.moves;

    this.refloatGrid(userMove.itemId);

    return this;
  }

  // Find items that can "float" to the top and apply the necessary moves.
  public refloatGrid(activeId?: ItemId): LayoutEngineStep {
    if (this.conflicts.size > 0) {
      return this;
    }

    let needAnotherRefloat = false;

    for (const item of this.grid.items) {
      // The active item is skipped until the operation is committed.
      if (item.id === activeId) {
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
        if (!this.validateVacantMove(this.grid, this.moves, { ...move, y: move.y - 1 }, activeId ?? "", false)) {
          break;
        }
      }
      if (item.y !== move.y) {
        this.makeMove({ grid: this.grid, moves: this.moves, overlaps: new Set(), score: 0 }, move, 0);
        needAnotherRefloat = true;
      }
    }

    if (needAnotherRefloat) {
      this.refloatGrid(activeId);
    }

    return this;
  }

  private makeMove(state: MoveVariantState, nextMove: CommittedMove, moveScore: number): void {
    const addOverlap = (itemId: ItemId) => {
      if (!this.conflicts.has(itemId)) {
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

  private findNextVariants(state: MoveVariantState, userMove: CommittedMove): MoveVariant[] {
    const activeId = userMove.itemId;
    const isResize = userMove.type === "RESIZE";
    const nextMoveVariants: MoveVariant[] = [];

    for (const overlap of [...state.overlaps]) {
      const overlapItem = state.grid.getItem(overlap);
      const overlapWith = this.getOverlapWith(state.grid, overlapItem);
      const directions = this.getPriorityDirections(state.moves, overlapWith, activeId, isResize);
      const vacantDirections = overlapWith.id !== activeId || isResize ? directions.slice(0, 3) : directions;

      for (let directionIndex = 0; directionIndex < directions.length; directionIndex++) {
        const moveDirection = directions[directionIndex];

        const vacantMoveDirection = vacantDirections[directionIndex];
        const move = this.getMoveForDirection(overlapItem, overlapWith, moveDirection, "OVERLAP");

        if (vacantMoveDirection && this.validateVacantMove(state.grid, state.moves, move, activeId, isResize)) {
          nextMoveVariants.push({ state: cloneMoveVariantState(state), move, moveScore: 1 });
        } else if (this.validatePriorityMove(state.grid, state.moves, move, activeId, isResize)) {
          nextMoveVariants.push({ state: cloneMoveVariantState(state), move, moveScore: 5 });
        }
      }
    }

    return nextMoveVariants;
  }

  // Retrieves prioritized list of directions to look for a resolution move.
  private getPriorityDirections(
    moves: CommittedMove[],
    issuer: LayoutEngineItem,
    activeId: ItemId,
    isResize: boolean
  ): Direction[] {
    const diff = this.getLastStepDiff(moves, issuer);

    const firstVertical = diff.y > 0 ? "down" : "up";
    const nextVertical = firstVertical === "up" ? "down" : "up";

    const firstHorizontal = diff.x > 0 ? "right" : "left";
    const nextHorizontal = firstHorizontal === "left" ? "right" : "left";

    const directions: Direction[] =
      Math.abs(diff.y) > Math.abs(diff.x)
        ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
        : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];

    if (issuer.id !== activeId || isResize) {
      const firstMove = directions[0];
      directions[0] = directions[3];
      directions[3] = firstMove;
    }

    return directions;
  }

  private getLastStepDiff(moves: CommittedMove[], issuer: LayoutEngineItem) {
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

  private validateVacantMove(
    grid: LayoutEngineGrid,
    moves: CommittedMove[],
    move: CommittedMove,
    activeId: ItemId,
    isResize: boolean
  ): boolean {
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

    if (isResize && activeId && !this.validateResizeMove(grid, moves, move, activeId)) {
      return false;
    }

    return true;
  }

  private validatePriorityMove(
    grid: LayoutEngineGrid,
    moves: CommittedMove[],
    move: CommittedMove,
    activeId: ItemId,
    isResize: boolean
  ): boolean {
    const moveTarget = grid.getItem(move.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = move.y + (y - moveTarget.y);
        const newX = move.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= grid.width) {
          return false;
        }

        for (const item of grid.getCell(newX, newY)) {
          // Can't overlap with the active item.
          if (item.id === activeId) {
            return false;
          }

          // The probed destination is currently blocked.
          if (this.conflicts.has(item.id)) {
            return false;
          }
        }
      }
    }

    if (isResize && activeId && !this.validateResizeMove(grid, moves, move, activeId)) {
      return false;
    }

    return true;
  }

  private validateResizeMove(
    grid: LayoutEngineGrid,
    moves: CommittedMove[],
    move: CommittedMove,
    activeId: ItemId
  ): boolean {
    const resizeTarget = grid.getItem(activeId);
    const moveTarget = grid.getItem(move.itemId);

    const diff = this.getLastStepDiff(moves, resizeTarget);
    const direction = diff.x ? "horizontal" : "vertical";

    const originalPlacement = {
      isNext: resizeTarget.x + resizeTarget.originalWidth - 1 < moveTarget.x,
      isBelow: resizeTarget.y + resizeTarget.originalHeight - 1 < moveTarget.y,
    };

    const nextPlacement = {
      isNext: resizeTarget.x + resizeTarget.width - 1 < move.x,
      isBelow: resizeTarget.y + resizeTarget.height - 1 < move.y,
    };

    return (
      (direction === "horizontal" && originalPlacement.isNext === nextPlacement.isNext) ||
      (direction === "horizontal" && !originalPlacement.isBelow && nextPlacement.isBelow) ||
      (direction === "vertical" && originalPlacement.isBelow === nextPlacement.isBelow)
    );
  }

  private getOverlapWith(grid: LayoutEngineGrid, targetItem: LayoutEngineItem): LayoutEngineItem {
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
  private getMoveForDirection(
    moveTarget: LayoutEngineItem,
    overlap: LayoutEngineItem,
    direction: Direction,
    moveType: CommittedMove["type"]
  ): CommittedMove {
    const common = { itemId: moveTarget.id, width: moveTarget.width, height: moveTarget.height, type: moveType };
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
  public findConflicts(grid: LayoutEngineGrid, move: CommittedMove): Set<ItemId> {
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
}
