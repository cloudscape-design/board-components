// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { StackSet } from "../utils/stack-set";
import { LayoutEngineGrid, LayoutEngineItem } from "./grid";
import { CommittedMove, InsertCommand, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { normalizeMovePath, normalizeResizePath, sortGridItems } from "./utils";

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
      const { width, height } = this.grid.getItem(itemId);
      const move: CommittedMove = { itemId, x: step.x, y: step.y, width, height, type: "MOVE" };

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
      const width = path[stepIndex].x - resizeTarget.x;
      const height = path[stepIndex].y - resizeTarget.y;

      this.grid.resize(itemId, width, height, this.addOverlap.bind(this));

      this.moves.push({ itemId, x: resizeTarget.x, y: resizeTarget.y, width, height, type: "RESIZE" });

      this.tryResolveOverlaps(itemId, stepIndex, true);
    }

    return new LayoutEngine(this);
  }

  insert({ itemId, width, height, path: [position, ...path] }: InsertCommand): LayoutEngine {
    this.cleanup();

    this.grid.insert({ id: itemId, ...position, width, height }, this.addOverlap.bind(this));

    this.moves.push({ itemId, ...position, width, height, type: "INSERT" });

    this.tryResolveOverlaps(itemId);

    return new LayoutEngine(this).move({ itemId, path });
  }

  remove(itemId: ItemId): LayoutEngine {
    this.cleanup();

    const { x, y, width, height } = this.grid.getItem(itemId);
    this.moves.push({ itemId, x, y, width, height, type: "REMOVE" });

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
  private tryResolveOverlaps(activeId: ItemId, priority = 0, resize = false): void {
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
        const nextMove = this.tryFindVacantMove(overlap, activeId, resize);
        if (nextMove) {
          this.makeMove(nextMove, priority);
        } else {
          priorityOverlaps.push(overlap);
        }
        overlap = this.overlaps.pop();
      }

      tryPriorityMoves();
    };

    const tryPriorityMoves = () => {
      // Try priority moves until first success and delegate back to vacant moves check.
      const overlap = priorityOverlaps.pop();
      if (overlap) {
        const nextMove = this.findPriorityMove(overlap, activeId, priority, resize);
        this.makeMove(nextMove, priority);
        tryVacantMoves();
      }
    };

    tryVacantMoves();

    if (this.conflicts.size === 0) {
      this.refloatGrid(activeId);
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
  private tryFindVacantMove(overlap: ItemId, activeId?: ItemId, resize = false): null | CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = resize ? this.getResizeDirections(overlapWith) : this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "VACANT");
      if (this.validateVacantMove(move, activeId, resize)) {
        return move;
      }
    }

    return null;
  }

  private validateVacantMove(move: CommittedMove, activeId?: ItemId, resize = false): boolean {
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

    if (resize && activeId && !this.validateResizeMove(move, activeId)) {
      return false;
    }

    return true;
  }

  // Find a move that resolves an overlap by moving an item over another item that has not been disturbed yet.
  private findPriorityMove(overlap: ItemId, activeId: ItemId, priority: number, resize = false): CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = resize ? this.getResizeDirections(overlapWith) : this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "PRIORITY");
      if (this.validatePriorityMove(move, activeId, priority, resize)) {
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
      if (this.validatePriorityMove(move, activeId, priority)) {
        return move;
      }
    }

    throw new Error("Invariant violation: can't find escape move.");
  }

  private validatePriorityMove(move: CommittedMove, activeId: ItemId, priority: number, resize = false): boolean {
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

          // The overlapping item has the same priority.
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

    if (resize && activeId && !this.validateResizeMove(move, activeId)) {
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

  // Find items that can "float" to the top and apply the necessary moves.
  private refloatGrid(activeId?: ItemId): void {
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
      this.refloatGrid(activeId);
    }
  }

  private validateMoveCommand({ itemId, path }: MoveCommand): MoveCommand {
    const moveTarget = this.grid.getItem(itemId);

    for (const step of path) {
      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > this.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }
    }

    return { itemId, path: normalizeMovePath(new Position({ x: moveTarget.x, y: moveTarget.y }), path) };
  }

  private validateResizeCommand({ itemId, path }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.grid.getItem(itemId);
    const x = resizeTarget.x + resizeTarget.width;
    const y = resizeTarget.y + resizeTarget.height;

    for (const step of path) {
      if (step.x < 1 || step.y < 1) {
        throw new Error("Invalid resize: can't resize to 0.");
      }
      if (step.x > this.grid.width) {
        throw new Error("Invalid resize: outside grid.");
      }
    }

    return { itemId, path: normalizeResizePath(new Position({ x, y }), path) };
  }
}
