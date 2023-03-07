// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, ItemId } from "../interfaces";
import { StackSet } from "../utils/stack-set";
import { LayoutEngineGrid, LayoutEngineItem } from "./grid";
import { CommittedMove } from "./interfaces";

export function resolveOverlaps(
  userMove: CommittedMove,
  grid: LayoutEngineGrid,
  moves: CommittedMove[],
  conflicts: Set<ItemId>
) {
  new LayoutEngineStep(grid, moves, conflicts).resolveOverlaps(userMove);
}

export function refloatGrid(grid: LayoutEngineGrid, moves: CommittedMove[], conflicts: Set<ItemId>) {
  new LayoutEngineStep(grid, moves, conflicts).refloatGrid();
}

class LayoutEngineStep {
  private grid: LayoutEngineGrid;
  private moves: CommittedMove[] = [];
  private conflicts = new Set<ItemId>();

  constructor(grid: LayoutEngineGrid, moves: CommittedMove[], conflicts: Set<ItemId>) {
    this.grid = grid;
    this.moves = moves;
    this.conflicts = conflicts;
  }

  // Issue moves on overlapping items trying to resolve all of them.
  public resolveOverlaps(userMove: CommittedMove): void {
    const priorities = new Map<ItemId, number>();
    const activeId = userMove.itemId;
    const isResize = userMove.type === "RESIZE";

    let overlaps = new StackSet<ItemId>();
    let priorityOverlaps = new StackSet<ItemId>();

    const addOverlap = (itemId: ItemId) => {
      if (!this.conflicts.has(itemId)) {
        overlaps.push(itemId);
      }
    };

    this.conflicts.clear();
    if (userMove.type === "MOVE") {
      this.findConflicts(userMove);
    }

    this.makeMove(userMove, addOverlap, priorities);

    const tryVacantMoves = () => {
      // Try vacant moves on all overlaps.
      let overlap = overlaps.pop();
      while (overlap) {
        const nextMove = this.tryFindVacantMove(overlap, activeId, isResize);
        if (nextMove) {
          this.makeMove(nextMove, addOverlap, priorities);
        } else {
          priorityOverlaps.push(overlap);
        }
        overlap = overlaps.pop();
      }

      overlaps = priorityOverlaps;
      priorityOverlaps = new StackSet<ItemId>();

      tryPriorityMoves();
    };

    const tryPriorityMoves = () => {
      // Try priority moves until first success and delegate back to vacant moves check.
      const overlap = overlaps.pop();
      if (overlap) {
        const nextMove = this.findPriorityMove(overlap, priorities, activeId, isResize);
        this.makeMove(nextMove, addOverlap, priorities);
        tryVacantMoves();
      }
    };

    tryVacantMoves();

    this.refloatGrid(activeId);
  }

  // Find items that can "float" to the top and apply the necessary moves.
  public refloatGrid(activeId?: ItemId): void {
    if (this.conflicts.size > 0) {
      return;
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
        if (!this.validateVacantMove({ ...move, y: move.y - 1 }, activeId ?? "", false)) {
          break;
        }
      }
      if (item.y !== move.y) {
        this.grid.move(move.itemId, move.x, move.y);
        this.moves.push(move);
        needAnotherRefloat = true;
      }
    }

    if (needAnotherRefloat) {
      this.refloatGrid(activeId);
    }
  }

  private makeMove(move: CommittedMove, addOverlap: (itemId: ItemId) => void, priorities: Map<ItemId, number>): void {
    switch (move.type) {
      case "ESCAPE":
      case "FLOAT":
      case "MOVE":
      case "VACANT":
      case "PRIORITY":
        this.grid.move(move.itemId, move.x, move.y, addOverlap);
        break;
      case "INSERT":
        this.grid.insert({ id: move.itemId, ...move }, addOverlap);
        break;
      case "REMOVE":
        this.grid.remove(move.itemId);
        break;
      case "RESIZE":
        this.grid.resize(move.itemId, move.width, move.height, addOverlap);
        break;
    }
    this.moves.push(move);
    priorities.set(move.itemId, this.getMovePriority(move));
  }

  private getMovePriority(move: CommittedMove) {
    switch (move.type) {
      case "FLOAT":
        return 0;
      case "VACANT":
        return 1;
      case "PRIORITY":
      case "ESCAPE":
        return 5;
      default:
        return 9999;
    }
  }

  // Retrieves prioritized list of directions to look for a resolution move.
  private getMoveDirections(issuer: LayoutEngineItem): Direction[] {
    const diff = this.getLastStepDiff(issuer);

    const firstVertical = diff.y > 0 ? "down" : "up";
    const nextVertical = firstVertical === "down" ? "up" : "down";

    const firstHorizontal = diff.x > 0 ? "right" : "left";
    const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

    return Math.abs(diff.y) > Math.abs(diff.x)
      ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
      : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];
  }

  private getResizeDirections(issuer: LayoutEngineItem): Direction[] {
    const diff = this.getLastStepDiff(issuer);

    const firstVertical = diff.y > 0 ? "up" : "down";
    const nextVertical = firstVertical === "down" ? "up" : "down";

    const firstHorizontal = diff.x > 0 ? "left" : "right";
    const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

    return Math.abs(diff.y) > Math.abs(diff.x)
      ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
      : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];
  }

  private getLastStepDiff(issuer: LayoutEngineItem) {
    const issuerMoves = this.moves.filter((move) => move.itemId === issuer.id);
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

  // Try finding a move that resolves an overlap by moving an item to a vacant space.
  private tryFindVacantMove(overlap: ItemId, activeId: ItemId, isResize: boolean): null | CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = isResize ? this.getResizeDirections(overlapWith) : this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "VACANT");
      if (this.validateVacantMove(move, activeId, isResize)) {
        return move;
      }
    }

    return null;
  }

  private validateVacantMove(move: CommittedMove, activeId: ItemId, isResize: boolean): boolean {
    const moveTarget = this.grid.getItem(move.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = move.y + (y - moveTarget.y);
        const newX = move.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return false;
        }

        // The probed destination is occupied.
        if (this.grid.getCellOverlap(newX, newY, move.itemId)) {
          return false;
        }
      }
    }

    if (isResize && activeId && !this.validateResizeMove(move, activeId)) {
      return false;
    }

    return true;
  }

  // Find a move that resolves an overlap by moving an item over another item that has not been disturbed yet.
  private findPriorityMove(
    overlap: ItemId,
    priorities: Map<ItemId, number>,
    activeId: ItemId,
    isResize: boolean
  ): CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = isResize ? this.getResizeDirections(overlapWith) : this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "PRIORITY");
      if (this.validatePriorityMove(move, priorities, activeId, isResize)) {
        return move;
      }
    }

    // If can't find a good move - "escape" item to the bottom.
    const move: CommittedMove = {
      itemId: overlapItem.id,
      y: overlapItem.y + 1,
      x: overlapItem.x,
      width: overlapItem.width,
      height: overlapItem.height,
      type: "ESCAPE",
    };
    for (move.y; move.y < 100; move.y++) {
      if (this.validatePriorityMove(move, priorities, activeId, false)) {
        return move;
      }
    }

    throw new Error("Invariant violation: can't find escape move.");
  }

  private validatePriorityMove(
    move: CommittedMove,
    priorities: Map<ItemId, number>,
    activeId: ItemId,
    isResize: boolean
  ): boolean {
    const moveTarget = this.grid.getItem(move.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = move.y + (y - moveTarget.y);
        const newX = move.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return false;
        }

        for (const item of this.grid.getCell(newX, newY)) {
          // Can't overlap with the active item.
          if (item.id === activeId) {
            return false;
          }

          // The overlapping item has same or bigger priority.
          if ((priorities.get(item.id) ?? 0) >= this.getMovePriority(move)) {
            return false;
          }

          // The probed destination is currently blocked.
          if (this.conflicts.has(item.id)) {
            return false;
          }
        }
      }
    }

    if (isResize && activeId && !this.validateResizeMove(move, activeId)) {
      return false;
    }

    return true;
  }

  private validateResizeMove(move: CommittedMove, activeId: ItemId): boolean {
    const resizeTarget = this.grid.getItem(activeId);
    const moveTarget = this.grid.getItem(move.itemId);

    const diff = this.getLastStepDiff(resizeTarget);
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
      (direction === "vertical" && originalPlacement.isBelow === nextPlacement.isBelow)
    );
  }

  private getOverlapWith(targetItem: LayoutEngineItem): LayoutEngineItem {
    for (let y = targetItem.y; y < targetItem.y + targetItem.height; y++) {
      for (let x = targetItem.x; x < targetItem.x + targetItem.width; x++) {
        const overlap = this.grid.getCellOverlap(x, y, targetItem.id);
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
  public findConflicts(move: CommittedMove) {
    const moveTarget = this.grid.getItem(move.itemId);
    const direction = `${move.x - moveTarget.x}:${move.y - moveTarget.y}`;

    switch (direction) {
      case "-1:0": {
        const left = Math.max(0, moveTarget.left - 1);
        for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
          const block = this.grid.getCellOverlap(left, y, moveTarget.id);
          if (block && block.x < left) {
            this.conflicts.add(block.id);
          }
        }
        break;
      }
      case "1:0": {
        const right = Math.min(this.grid.width - 1, moveTarget.right + 1);
        for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
          const block = this.grid.getCellOverlap(right, y, moveTarget.id);
          if (block && block.x + block.width - 1 > right) {
            this.conflicts.add(block.id);
          }
        }
        break;
      }
      case "0:-1": {
        const top = Math.max(0, moveTarget.top - 1);
        for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
          const block = this.grid.getCellOverlap(x, top, moveTarget.id);
          if (block && block.y < top) {
            this.conflicts.add(block.id);
          }
        }
        break;
      }
      case "0:1": {
        const bottom = moveTarget.bottom + 1;
        for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
          const block = this.grid.getCellOverlap(x, bottom, moveTarget.id);
          if (block && block.y + block.height - 1 > bottom) {
            this.conflicts.add(block.id);
          }
        }
        break;
      }
      default:
        throw new Error(`Invariant violation: unexpected direction ${direction}.`);
    }
  }
}
