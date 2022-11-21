// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StackSet } from "../utils/stack-set";
import { DndGrid, DndItem } from "./grid";
import {
  CommittedMove,
  Direction,
  GridDefinition,
  GridTransition,
  Item,
  ItemId,
  MoveCommand,
  Position,
  ResizeCommand,
} from "./interfaces";

export class DndEngine {
  private lastCommit: GridDefinition;
  private grid: DndGrid;
  private moves: CommittedMove[] = [];
  private conflicts = new StackSet<ItemId>();
  private blocks = new Set<ItemId>();

  constructor(gridDefinition: GridDefinition) {
    this.lastCommit = gridDefinition;
    this.grid = new DndGrid(gridDefinition);
  }

  move(moveCommand: MoveCommand): GridTransition {
    this.cleanup();

    const { itemId, path } = this.validateMoveCommand(moveCommand);

    for (const step of path) {
      const move: CommittedMove = { itemId, x: step.x, y: step.y, type: "USER" };

      this.findBlocks(move);

      this.grid.move(move.itemId, move.x, move.y, (conflictId) => this.conflicts.push(conflictId));
      this.moves.push(move);

      this.resolveConflicts(itemId);
    }

    if (this.blocks.size === 0) {
      this.refloatGrid();
    }

    return this.getTransition();
  }

  resize(resize: ResizeCommand): GridTransition {
    this.cleanup();

    resize = this.validateResizeCommand(resize);

    this.grid.resize(resize.itemId, resize.width, resize.height, (conflictId) => this.conflicts.push(conflictId));

    this.resolveConflicts(resize.itemId);

    if (this.blocks.size === 0) {
      this.refloatGrid();
    }

    return this.getTransition();
  }

  insert(item: Item): GridTransition {
    this.cleanup();

    this.grid.insert(item, (conflictId) => this.conflicts.push(conflictId));

    this.resolveConflicts(item.id);

    if (this.blocks.size === 0) {
      this.refloatGrid();
    }

    return this.getTransition();
  }

  remove(itemId: ItemId): GridTransition {
    this.cleanup();

    this.grid.remove(itemId);

    if (this.blocks.size === 0) {
      this.refloatGrid();
    }

    return this.getTransition();
  }

  commit(): GridTransition {
    const transition = this.getTransition();

    if (this.blocks.size === 0) {
      this.lastCommit = transition.end;
      this.cleanup();
    }

    return transition;
  }

  getTransition(): GridTransition {
    const end = {
      items: this.grid.items.map((item) => ({ ...item })).sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y)),
      width: this.grid.width,
    };
    return { start: this.lastCommit, end, moves: [...this.moves], blocks: [...this.blocks] };
  }

  private cleanup(): void {
    this.grid = new DndGrid(this.lastCommit);
    this.moves = [];
    this.conflicts = new StackSet();
    this.blocks = new Set();
  }

  private resolveConflicts(interactiveId: ItemId): void {
    const tier2Conflicts: ItemId[] = [];

    // Try resolving conflicts by finding the vacant space considering the move directions.
    let conflict = this.conflicts.pop();
    while (conflict) {
      // Ignoring blocked items - those must stay in place.
      if (this.blocks.has(conflict)) {
        conflict = this.conflicts.pop();
        continue;
      }

      const nextMove = this.tryFindVacantMove(conflict);
      if (nextMove) {
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, (conflictId) => this.conflicts.push(conflictId));
        this.moves.push(nextMove);
      } else {
        tier2Conflicts.push(conflict);
      }
      conflict = this.conflicts.pop();
    }

    // Try resolving conflicts by moving against items that have the same or lower priority.
    this.conflicts = new StackSet(tier2Conflicts);
    conflict = this.conflicts.pop();
    while (conflict) {
      // Ignoring blocked items - those must stay in place.
      if (this.blocks.has(conflict)) {
        conflict = this.conflicts.pop();
        continue;
      }

      const nextMove = this.tryFindPriorityMove(conflict, interactiveId);
      if (nextMove) {
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, (conflictId) => this.conflicts.push(conflictId));
        this.moves.push(nextMove);
      } else {
        // There is no good way to resolve conflicts at this point.
      }
      conflict = this.conflicts.pop();
    }
  }

  // Get priority move directions by comparing conflicting items positions.
  private getMoveDirections(origin: DndItem): Direction[] {
    const originMoves = this.moves.filter((m) => m.itemId === origin.id);

    // The move is missing when origin resizes.
    const lastOriginMove = originMoves[originMoves.length - 1] || { x: origin.originalX, y: origin.originalY };

    const diffVertical = origin.originalY - lastOriginMove.y;
    const firstVertical = diffVertical > 0 ? "bottom" : "top";
    const nextVertical = firstVertical === "bottom" ? "top" : "bottom";

    const diffHorizontal = origin.originalX - lastOriginMove.x;
    const firstHorizontal = diffHorizontal > 0 ? "right" : "left";
    const nextHorizontal = firstHorizontal === "right" ? "left" : "right";

    const directions: Direction[] =
      Math.abs(diffVertical) > Math.abs(diffHorizontal)
        ? [firstVertical, firstHorizontal, nextHorizontal, nextVertical]
        : [firstHorizontal, firstVertical, nextVertical, nextHorizontal];

    return directions;
  }

  private tryFindVacantMove(conflict: ItemId): null | CommittedMove {
    const conflictItem = this.grid.getItem(conflict);
    const conflictWith = this.getConflictWith(conflictItem);
    const directions = this.getMoveDirections(conflictWith);

    for (const direction of directions) {
      for (const move of this.getMovesForDirection(conflictItem, conflictWith, direction, "VACANT")) {
        if (this.validateVacantMove(move)) {
          return move;
        }
      }
    }

    return null;
  }

  private tryFindPriorityMove(conflict: ItemId, interactiveId: ItemId): null | CommittedMove {
    const conflictItem = this.grid.getItem(conflict);
    const conflictWith = this.getConflictWith(conflictItem);
    const directions = this.getMoveDirections(conflictWith);

    for (const direction of directions) {
      for (const move of this.getMovesForDirection(conflictItem, conflictWith, direction, "PRIORITY")) {
        if (this.validatePriorityMove(move, interactiveId) === "ok") {
          return move;
        }
      }
    }

    // If can't find a good move - "teleport" item to the bottom.
    const move: CommittedMove = { itemId: conflictItem.id, y: conflictItem.y + 1, x: conflictItem.x, type: "ESCAPE" };
    let canMove = this.validatePriorityMove(move, interactiveId);
    while (canMove !== "ok") {
      move.y++;
      canMove = this.validatePriorityMove(move, interactiveId);

      // Can't move over blocked items.
      if (canMove === "blocked") {
        return null;
      }
    }
    return move;
  }

  private getConflictWith(targetItem: DndItem): DndItem {
    for (let y = targetItem.y; y < targetItem.y + targetItem.height; y++) {
      for (let x = targetItem.x; x < targetItem.x + targetItem.width; x++) {
        const conflict = this.grid.getCellOverlay(x, y, targetItem.id);
        if (conflict) {
          return conflict;
        }
      }
    }
    throw new Error("Invariant violation - no conflicts found.");
  }

  private validateVacantMove(moveAttempt: CommittedMove): boolean {
    const moveTarget = this.grid.getItem(moveAttempt.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = moveAttempt.y + (y - moveTarget.y);
        const newX = moveAttempt.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return false;
        }

        // The probed destination cell is occupied.
        const conflict = this.grid.getCellOverlay(newX, newY, moveAttempt.itemId);
        if (conflict) {
          return false;
        }
      }
    }

    return true;
  }

  private validatePriorityMove(moveAttempt: CommittedMove, interactiveId: ItemId): "ok" | "blocked" | "priority" {
    const moveTarget = this.grid.getItem(moveAttempt.itemId);

    for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const newY = moveAttempt.y + (y - moveTarget.y);
        const newX = moveAttempt.x + (x - moveTarget.x);

        // Outside the grid.
        if (newY < 0 || newX < 0 || newX >= this.grid.width) {
          return "blocked";
        }

        for (const item of this.grid.getCell(newX, newY)) {
          // Can't conflict with the interactive item.
          if (item.id === interactiveId) {
            return "priority";
          }

          // The conflicting item has already been displaced.
          if (item.x !== item.originalX || item.y !== item.originalY) {
            return "priority";
          }

          // The probed destination i currently blocked.
          if (this.blocks.has(item.id)) {
            return "blocked";
          }
        }
      }
    }

    return "ok";
  }

  private findBlocks(move: CommittedMove): void {
    this.blocks = new Set<ItemId>();

    const moveTarget = this.grid.getItem(move.itemId);
    const direction = `${move.x - moveTarget.x}:${move.y - moveTarget.y}`;

    switch (direction) {
      case "-1:0": {
        const left = Math.max(0, moveTarget.left - 1);
        for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
          const block = this.grid.getCellOverlay(left, y, moveTarget.id);
          if (block && block.x < left) {
            this.blocks.add(block.id);
          }
        }
        break;
      }
      case "1:0": {
        const right = Math.min(this.grid.width - 1, moveTarget.right + 1);
        for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
          const block = this.grid.getCellOverlay(right, y, moveTarget.id);
          if (block && block.x + block.width - 1 > right) {
            this.blocks.add(block.id);
          }
        }
        break;
      }
      case "0:-1": {
        const top = Math.max(0, moveTarget.top - 1);
        for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
          const block = this.grid.getCellOverlay(x, top, moveTarget.id);
          if (block && block.y < top) {
            this.blocks.add(block.id);
          }
        }
        break;
      }
      case "0:1": {
        const bottom = moveTarget.bottom + 1;
        for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
          const block = this.grid.getCellOverlay(x, bottom, moveTarget.id);
          if (block && block.y + block.height - 1 > bottom) {
            this.blocks.add(block.id);
          }
        }
        break;
      }
      default:
        throw new Error(`Invariant violation: unexpected direction ${direction}.`);
    }
  }

  // Retrieve all possible moves for the given direction (same direction but different length).
  private getMovesForDirection(
    moveTarget: DndItem,
    conflict: DndItem,
    direction: Direction,
    moveType: CommittedMove["type"]
  ): CommittedMove[] {
    switch (direction) {
      case "top": {
        const from = conflict.top - (moveTarget.height - 1);
        const coveredDistance = Math.max(0, conflict.top - moveTarget.top);
        const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY) - coveredDistance);
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: from - i, x: moveTarget.x, type: moveType });
        }

        return moves;
      }

      case "bottom": {
        const from = conflict.bottom;
        const coveredDistance = Math.max(0, moveTarget.bottom - conflict.bottom);
        const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY) - coveredDistance);
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: from + i, x: moveTarget.x, type: moveType });
        }

        return moves;
      }

      case "left": {
        const from = conflict.left - (moveTarget.width - 1);
        const coveredDistance = Math.max(0, conflict.left - moveTarget.left);
        const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX) - coveredDistance);
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: from - i, type: moveType });
        }

        return moves;
      }

      case "right": {
        const from = conflict.right;
        const coveredDistance = Math.max(0, moveTarget.right - conflict.right);
        const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX) - coveredDistance);
        const moves: CommittedMove[] = [];

        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: from + i, type: moveType });
        }

        return moves;
      }
    }
  }

  // Find items that can "float" to the top and apply the necessary moves.
  private refloatGrid(): void {
    let needRefloat = true;

    while (needRefloat) {
      let floatCandidates: [id: ItemId, affordance: number][] = [];
      const floatAffordance: number[][] = [];

      for (let y = 0; y < this.grid.height; y++) {
        floatAffordance.push(Array(this.grid.width).fill(0));

        const itemFloatAfforance = new Map<ItemId, number>();

        for (let x = 0; x < this.grid.width; x++) {
          const [item] = this.grid.getCell(x, y);
          const prevRowAffordance = floatAffordance[y - 1]?.[x] ?? 0;

          if (item) {
            floatAffordance[y][x] = 0;

            const prevItemAffordance = itemFloatAfforance.get(item.id);
            if (prevItemAffordance === undefined) {
              itemFloatAfforance.set(item.id, prevRowAffordance);
            } else {
              itemFloatAfforance.set(item.id, Math.min(prevItemAffordance, prevRowAffordance));
            }
          } else {
            floatAffordance[y][x] = prevRowAffordance + 1;
          }
        }

        floatCandidates = [...itemFloatAfforance.entries()].filter(([, affordance]) => affordance > 0);

        if (floatCandidates.length > 0) {
          break;
        }
      }

      needRefloat = floatCandidates.length > 0;

      for (const [id, affordance] of floatCandidates) {
        const item = this.grid.getItem(id);
        const move: CommittedMove = { itemId: id, x: item.x, y: item.y - affordance, type: "FLOAT" };

        this.grid.move(move.itemId, move.x, move.y);
        this.moves.push(move);
      }
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

    return { itemId, path: this.normalizePath({ x: moveTarget.x, y: moveTarget.y }, path) };
  }

  private normalizePath(origin: Position, path: readonly Position[]): readonly Position[] {
    const mutablePath = [origin, ...path];
    const originKey = `${origin.x}:${origin.y}`;
    const steps = new Map([[originKey, 0]]);

    for (let stepIndex = 1; stepIndex < mutablePath.length; stepIndex++) {
      const stepKey = `${mutablePath[stepIndex].x}:${mutablePath[stepIndex].y}`;
      const removeFrom = steps.get(stepKey);

      if (removeFrom !== undefined) {
        for (let removeStepIndex = stepIndex - 1; removeStepIndex >= removeFrom; removeStepIndex--) {
          const removeStepKey = `${mutablePath[removeStepIndex].x}:${mutablePath[removeStepIndex].y}`;
          steps.delete(removeStepKey);
          mutablePath.splice(removeStepIndex, 1);
        }
      }
      steps.set(stepKey, stepIndex);
    }

    return mutablePath.slice(1);
  }

  private validateResizeCommand({ itemId, width, height }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.grid.getItem(itemId);
    const normalizedWidth = Math.min(Math.max(1, width), this.grid.width - resizeTarget.x);
    const normalizedHeight = Math.max(1, height);
    return { itemId, width: normalizedWidth, height: normalizedHeight };
  }
}
