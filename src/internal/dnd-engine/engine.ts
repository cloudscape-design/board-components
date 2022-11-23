// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, GridLayoutItem, ItemId } from "../interfaces";
import { StackSet } from "../utils/stack-set";
import { DndGrid, DndItem } from "./grid";
import { CommittedMove, Direction, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { normalizePath, sortGridItems } from "./utils";

// TODO: Rename DndEngine -> LayoutEngine.

export class DndEngine {
  private current: GridLayout;
  private grid: DndGrid;
  private moves: CommittedMove[] = [];
  private overlaps = new StackSet<ItemId>();
  private conflicts = new Set<ItemId>();
  private chained = false;

  constructor(args: GridLayout | DndEngine) {
    if (args instanceof DndEngine) {
      this.current = args.current;
      this.grid = args.grid;
      this.moves = args.moves;
      this.overlaps = args.overlaps;
      this.conflicts = args.conflicts;
      this.chained = true;
    } else {
      this.current = args;
      this.grid = new DndGrid(args.items, args.columns);
    }
  }

  move(moveCommand: MoveCommand): DndEngine {
    this.cleanup();

    const { itemId, path } = this.validateMoveCommand(moveCommand);

    for (const step of path) {
      const move: CommittedMove = { itemId, x: step.x, y: step.y, type: "USER" };

      this.findConflicts(move);

      this.grid.move(move.itemId, move.x, move.y, this.addOverlap.bind(this));
      this.moves.push(move);

      this.tryResolveOverlaps(itemId);
    }

    if (this.conflicts.size === 0) {
      this.refloatGrid();
    }

    return new DndEngine(this);
  }

  resize(resize: ResizeCommand): DndEngine {
    this.cleanup();

    resize = this.validateResizeCommand(resize);

    this.grid.resize(resize.itemId, resize.width, resize.height, this.addOverlap.bind(this));

    this.tryResolveOverlaps(resize.itemId);

    if (this.conflicts.size === 0) {
      this.refloatGrid();
    }

    return new DndEngine(this);
  }

  insert(item: GridLayoutItem): DndEngine {
    this.cleanup();

    this.grid.insert(item, this.addOverlap.bind(this));

    this.tryResolveOverlaps(item.id);

    if (this.conflicts.size === 0) {
      this.refloatGrid();
    }

    return new DndEngine(this);
  }

  remove(itemId: ItemId): DndEngine {
    this.cleanup();

    this.grid.remove(itemId);

    if (this.conflicts.size === 0) {
      this.refloatGrid();
    }

    return new DndEngine(this);
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
      this.grid = new DndGrid(this.current.items, this.current.columns);
      this.moves = [];
      this.overlaps = new StackSet();
      this.conflicts = new Set();
    }
  }

  private addOverlap(itemId: ItemId): void {
    if (!this.conflicts.has(itemId)) {
      this.overlaps.push(itemId);
    }
  }

  // Issue moves on overlapping items trying to resolve all of them.
  // It might not be possible to resolve overlaps if conflicts are present.
  private tryResolveOverlaps(activeId: ItemId): void {
    const tier2Overlaps = new StackSet<ItemId>();

    // Try resolving overlaps by finding the vacant space considering the move directions.
    let overlap = this.overlaps.pop();
    while (overlap) {
      const nextMove = this.tryFindVacantMove(overlap);
      if (nextMove) {
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, this.addOverlap.bind(this));
        this.moves.push(nextMove);
      } else {
        tier2Overlaps.push(overlap);
      }
      overlap = this.overlaps.pop();
    }

    this.overlaps = tier2Overlaps;

    // Try resolving overlaps by moving against items that have the same or lower priority.
    overlap = this.overlaps.pop();
    while (overlap) {
      const nextMove = this.tryFindPriorityMove(overlap, activeId);
      if (nextMove) {
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, this.addOverlap.bind(this));
        this.moves.push(nextMove);
      } else {
        // Can't resolve this overlap because of the blocked items.
        // That is expected - such overlaps can be resolved once the conflicts are gone.
      }
      overlap = this.overlaps.pop();
    }
  }

  // Retrieves prioritized list of directions to look for a resolution move.
  private getMoveDirections(issuer: DndItem): Direction[] {
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
      if (this.validateVacantMove(move) === "ok") {
        return move;
      }
    }

    return null;
  }

  private validateVacantMove(move: CommittedMove): "ok" | "blocked" | "occupied" {
    const moveTarget = this.grid.getItem(move.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = move.y + (y - moveTarget.y);
        const newX = move.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return "blocked";
        }

        // The probed destination is occupied.
        if (this.grid.getCellOverlap(newX, newY, move.itemId)) {
          return "occupied";
        }
      }
    }

    return "ok";
  }

  // Try finding a move that resovles an overlap by moving an item over another item that has not been disturbed yet.
  private tryFindPriorityMove(overlap: ItemId, activeId: ItemId): null | CommittedMove {
    const overlapItem = this.grid.getItem(overlap);
    const overlapWith = this.getOverlapWith(overlapItem);
    const directions = this.getMoveDirections(overlapWith);

    for (const direction of directions) {
      const move = this.getMoveForDirection(overlapItem, overlapWith, direction, "PRIORITY");
      if (this.validatePriorityMove(move, activeId) === "ok") {
        return move;
      }
    }

    // If can't find a good move - "escape" item to the bottom.
    const move: CommittedMove = { itemId: overlapItem.id, y: overlapItem.y + 1, x: overlapItem.x, type: "ESCAPE" };
    for (move.y; move.y < 100; move.y++) {
      switch (this.validatePriorityMove(move, activeId)) {
        // Skipping items with higher priority.
        case "priority":
          break;

        // Can't move past blocked items.
        case "blocked":
          return null;

        // This move works.
        case "ok":
          return move;
      }
    }

    return null;
  }

  private validatePriorityMove(move: CommittedMove, activeId: ItemId): "ok" | "blocked" | "priority" {
    const moveTarget = this.grid.getItem(move.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = move.y + (y - moveTarget.y);
        const newX = move.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return "blocked";
        }

        for (const item of this.grid.getCell(newX, newY)) {
          // Can't overlap with the active item.
          if (item.id === activeId) {
            return "priority";
          }

          // The overlaping item has already been displaced.
          if (item.x !== item.originalX || item.y !== item.originalY) {
            return "priority";
          }

          // The probed destination i currently blocked.
          if (this.conflicts.has(item.id)) {
            return "blocked";
          }
        }
      }
    }

    return "ok";
  }

  private getOverlapWith(targetItem: DndItem): DndItem {
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
    moveTarget: DndItem,
    overlap: DndItem,
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
        if (this.validateVacantMove({ ...move, y: move.y - 1 }) !== "ok") {
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

  private validateResizeCommand({ itemId, width, height }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.grid.getItem(itemId);
    const normalizedWidth = Math.min(Math.max(1, width), this.grid.width - resizeTarget.x);
    const normalizedHeight = Math.max(1, height);
    return { itemId, width: normalizedWidth, height: normalizedHeight };
  }
}
