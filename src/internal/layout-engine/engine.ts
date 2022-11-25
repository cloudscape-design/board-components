// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, GridLayoutItem, ItemId } from "../interfaces";
import { StackSet } from "../utils/stack-set";
import { LayoutEngineGrid, LayoutEngineItem } from "./grid";
import { CommittedMove, Direction, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { normalizePath, sortGridItems } from "./utils";

export class LayoutEngine {
  private current: GridLayout;
  private grid: LayoutEngineGrid;
  private moves: CommittedMove[] = [];
  private priority = new Map<ItemId, number>();
  private overlaps = new StackSet<ItemId>();
  private conflicts = new Set<ItemId>();
  private chained = false;

  constructor(args: GridLayout | LayoutEngine) {
    if (args instanceof LayoutEngine) {
      this.current = args.current;
      this.grid = args.grid;
      this.moves = args.moves;
      this.priority = args.priority;
      this.overlaps = args.overlaps;
      this.conflicts = args.conflicts;
      this.chained = true;
    } else {
      this.current = args;
      this.grid = new LayoutEngineGrid(args.items, args.columns);
    }
  }

  move(moveCommand: MoveCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateMoveCommand(moveCommand);

    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const step = path[stepIndex];
      const move: CommittedMove = { itemId, x: step.x, y: step.y, type: "USER" };

      this.findConflicts(move);

      this.makeMove(move, stepIndex);

      this.tryResolveOverlaps(itemId, stepIndex);
    }

    return new LayoutEngine(this);
  }

  resize(resize: ResizeCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateResizeCommand(resize);
    const resizeTarget = this.grid.getItem(itemId);

    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const newWidth = path[stepIndex].x - resizeTarget.x;
      const newHeight = path[stepIndex].y - resizeTarget.y;

      this.grid.resize(resize.itemId, newWidth, newHeight, this.addOverlap.bind(this));

      this.tryResolveOverlaps(itemId, stepIndex);
    }

    this.tryResolveOverlaps(resize.itemId);

    return new LayoutEngine(this);
  }

  insert(item: GridLayoutItem): LayoutEngine {
    this.cleanup();

    this.grid.insert(item, this.addOverlap.bind(this));

    this.tryResolveOverlaps(item.id);

    return new LayoutEngine(this);
  }

  remove(itemId: ItemId): LayoutEngine {
    this.cleanup();

    this.grid.remove(itemId);

    return new LayoutEngine(this);
  }

  refloat(): LayoutEngine {
    if (this.conflicts.size === 0) {
      this.refloatGrid();
    }
    return new LayoutEngine(this);
  }

  getLayoutShift(): LayoutShift {
    return {
      current: this.current,
      next: {
        items: sortGridItems(this.grid.items.map((item) => ({ ...item }))),
        columns: this.grid.width,
        rows: this.grid.height,
      },
      moves: [...this.moves],
      conflicts: [...this.conflicts],
    };
  }

  private cleanup(): void {
    if (!this.chained) {
      this.grid = new LayoutEngineGrid(this.current.items, this.current.columns);
      this.moves = [];
      this.priority = new Map();
      this.overlaps = new StackSet();
      this.conflicts = new Set();
    }
  }

  private makeMove(move: CommittedMove, priority?: number): void {
    this.grid.move(move.itemId, move.x, move.y, this.addOverlap.bind(this));
    this.moves.push(move);
    if (priority !== undefined) {
      this.priority.set(move.itemId, priority);
    }
  }

  private addOverlap(itemId: ItemId): void {
    if (!this.conflicts.has(itemId)) {
      this.overlaps.push(itemId);
    }
  }

  // Issue moves on overlapping items trying to resolve all of them.
  // It might not be possible to resolve overlaps if conflicts are present.
  private tryResolveOverlaps(activeId: ItemId, priority = 0): void {
    const priorityOverlaps = new StackSet<ItemId>();

    const tryVacantMoves = () => {
      // Copy priority overlaps back to main stack.
      let priorityOverlap = priorityOverlaps.pop();
      while (priorityOverlap) {
        this.overlaps.push(priorityOverlap);
        priorityOverlap = priorityOverlaps.pop();
      }

      // Try vacant moves on all overlaps.
      let overlap = this.overlaps.pop();
      while (overlap) {
        const nextMove = this.tryFindVacantMove(overlap);
        if (nextMove) {
          this.makeMove(nextMove, priority);
        } else {
          priorityOverlaps.push(overlap);
        }
        overlap = this.overlaps.pop();
      }

      tryPiorityMoves();
    };

    const tryPiorityMoves = () => {
      // Try priority moves until first success and delegate back to vacant moves check.
      let overlap = priorityOverlaps.pop();
      while (overlap) {
        const nextMove = this.tryFindPriorityMove(overlap, activeId, priority);
        if (nextMove) {
          this.makeMove(nextMove, priority);
          tryVacantMoves();
          break;
        } else {
          // Can't resolve this overlap because of the blocked items.
          // That is expected - such overlaps can be resolved once the conflicts are gone.
        }
        overlap = priorityOverlaps.pop();
      }
    };

    tryVacantMoves();
  }

  // Retrieves prioritized list of directions to look for a resolution move.
  private getMoveDirections(issuer: LayoutEngineItem): Direction[] {
    const issuerMoves = this.moves.filter((move) => move.itemId === issuer.id);

    // The move is missing when issuer resizes.
    const lastIssuerMove = issuerMoves[issuerMoves.length - 1] || { x: issuer.originalX, y: issuer.originalY };

    const diffVertical = issuer.originalY - lastIssuerMove.y;
    const firstVertical = diffVertical > 0 ? "bottom" : "top";
    const nextVertical = firstVertical === "bottom" ? "top" : "bottom";

    const diffHorizontal = issuer.originalX - lastIssuerMove.x;
    const firstHorizontal = diffHorizontal > 0 ? "right" : "left";
    const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

    return Math.abs(diffVertical) > Math.abs(diffHorizontal)
      ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
      : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];
  }

  // Try finding a move that resovles an overlap by moving an item to a vacant space.
  private tryFindVacantMove(overlap: ItemId): null | CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "VACANT");
      if (this.validateVacantMove(move)) {
        return move;
      }
    }

    return null;
  }

  private validateVacantMove(move: CommittedMove): boolean {
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

    return true;
  }

  // Try finding a move that resovles an overlap by moving an item over another item that has not been disturbed yet.
  private tryFindPriorityMove(overlap: ItemId, activeId: ItemId, priority: number): null | CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "PRIORITY");
      if (this.validatePriorityMove(move, activeId, priority)) {
        return move;
      }
    }

    // "Escape" moves are not allowed when there are conflicts.
    if (this.conflicts.size > 0) {
      return null;
    }

    // If can't find a good move - "escape" item to the bottom.
    const move: CommittedMove = { itemId: overlapItem.id, y: overlapItem.y + 1, x: overlapItem.x, type: "ESCAPE" };
    for (move.y; move.y < 100; move.y++) {
      if (this.validatePriorityMove(move, activeId, priority)) {
        return move;
      }
    }

    return null;
  }

  private validatePriorityMove(move: CommittedMove, activeId: ItemId, priority: number): boolean {
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

          // The overlaping item has the same priority.
          if (this.priority.get(item.id) === priority) {
            return false;
          }

          // The probed destination is currently blocked.
          if (this.conflicts.has(item.id)) {
            return false;
          }
        }
      }
    }

    return true;
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

  // Find items that the active item cannot be moved over with the current move.
  private findConflicts(move: CommittedMove): void {
    this.conflicts = new Set<ItemId>();

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

  // Retrieve first possible move for the given direction to resolve the overlap.
  private getMoveForDirection(
    moveTarget: LayoutEngineItem,
    overlap: LayoutEngineItem,
    direction: Direction,
    moveType: CommittedMove["type"]
  ): CommittedMove {
    switch (direction) {
      case "top": {
        return { itemId: moveTarget.id, y: overlap.top - moveTarget.height, x: moveTarget.x, type: moveType };
      }

      case "bottom": {
        return { itemId: moveTarget.id, y: overlap.bottom + 1, x: moveTarget.x, type: moveType };
      }

      case "left": {
        return { itemId: moveTarget.id, y: moveTarget.y, x: overlap.left - moveTarget.width, type: moveType };
      }

      case "right": {
        return { itemId: moveTarget.id, y: moveTarget.y, x: overlap.right + 1, type: moveType };
      }
    }
  }

  // Find items that can "float" to the top and apply the necessary moves.
  private refloatGrid(): void {
    let needAnotherRefloat = false;

    for (const item of this.grid.items) {
      const move: CommittedMove = { itemId: item.id, x: item.x, y: item.y, type: "FLOAT" };
      for (move.y; move.y >= 0; move.y--) {
        if (!this.validateVacantMove({ ...move, y: move.y - 1 })) {
          break;
        }
      }
      if (item.y !== move.y) {
        this.makeMove(move);
        needAnotherRefloat = true;
      }
    }

    if (needAnotherRefloat) {
      this.refloatGrid();
    }
  }

  private validateMoveCommand({ itemId, path }: MoveCommand): MoveCommand {
    const moveTarget = this.grid.getItem(itemId);

    let prevX = moveTarget.x;
    let prevY = moveTarget.y;
    for (const step of path) {
      const diffVertical = step.y - prevY;
      const diffHorizontal = step.x - prevX;

      if (Math.abs(diffVertical) + Math.abs(diffHorizontal) !== 1) {
        throw new Error("Invalid move: must move one step at a time.");
      }

      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > this.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }

      prevX = step.x;
      prevY = step.y;
    }

    return { itemId, path: normalizePath({ x: moveTarget.x, y: moveTarget.y }, path) };
  }

  private validateResizeCommand({ itemId, path }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.grid.getItem(itemId);
    const x = resizeTarget.x + resizeTarget.width;
    const y = resizeTarget.y + resizeTarget.height;

    let prevX = x;
    let prevY = y;

    for (const step of path) {
      const diffVertical = step.y - prevY;
      const diffHorizontal = step.x - prevX;

      if (Math.abs(diffVertical) + Math.abs(diffHorizontal) !== 1) {
        throw new Error("Invalid resize: must resize one step at a time.");
      }

      if (step.x < 1 || step.y < 1) {
        throw new Error("Invalid resize: can't resize to 0.");
      }

      if (step.x > this.grid.width) {
        throw new Error("Invalid resize: outside grid.");
      }

      prevX = step.x;
      prevY = step.y;
    }

    return { itemId, path: normalizePath({ x, y }, path) };
  }
}
