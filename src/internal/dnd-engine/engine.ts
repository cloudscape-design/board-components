// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DndGrid, DndItem } from "./grid";
import {
  CommittedMove,
  Direction,
  GridDefinition,
  GridTransition,
  Item,
  ItemId,
  MoveCommand,
  ResizeCommand,
} from "./interfaces";
import { SeqSet } from "./seq-set";

export class DndEngine {
  private lastCommit: GridDefinition;
  private grid: DndGrid;
  private moves: CommittedMove[] = [];
  private conflicts = new SeqSet<ItemId>();
  private blocks = new Set<ItemId>();

  constructor(gridDefinition: GridDefinition) {
    this.lastCommit = gridDefinition;
    this.grid = new DndGrid(gridDefinition);
  }

  move({ itemId, path }: MoveCommand): GridTransition {
    this.cleanup();

    this.validateMoveCommand({ itemId, path });

    for (const step of path) {
      const move: CommittedMove = { itemId, x: step.x, y: step.y, type: "USER" };

      this.findBlocks(move);

      this.grid.move(move.itemId, move.x, move.y, (conflictId) => this.conflicts.add(conflictId));
      this.moves.push(move);

      this.resolveConflicts(itemId);
    }

    return this.getTransition();
  }

  resize(resize: ResizeCommand): GridTransition {
    this.cleanup();

    this.validateResizeCommand(resize);

    this.grid.resize(resize.itemId, resize.width, resize.height, (conflictId) => this.conflicts.add(conflictId));

    this.resolveConflicts(resize.itemId);

    return this.getTransition();
  }

  insert(item: Item): GridTransition {
    this.cleanup();

    this.grid.insert(item, (conflictId) => this.conflicts.add(conflictId));

    this.resolveConflicts(item.id);

    return this.getTransition();
  }

  remove(itemId: ItemId): GridTransition {
    this.cleanup();

    this.grid.remove(itemId);

    return this.getTransition();
  }

  commit(): GridTransition {
    if (this.blocks.size === 0) {
      this.refloatGrid();
    }

    const transitionWithRefloat = this.getTransition();

    if (this.blocks.size === 0) {
      this.lastCommit = transitionWithRefloat.end;
      this.cleanup();
    }

    return transitionWithRefloat;
  }

  getTransition(): GridTransition {
    const end = {
      items: this.grid.items.sort((a, b) => (b.y - a.y === 0 ? b.x - a.x : b.y - a.y)),
      width: this.grid.width,
    };
    return { start: this.lastCommit, end, moves: [...this.moves], blocks: [...this.blocks] };
  }

  private cleanup(): void {
    this.grid = new DndGrid(this.lastCommit);
    this.moves = [];
    this.conflicts = new SeqSet();
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
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, (conflictId) => this.conflicts.add(conflictId));
        this.moves.push(nextMove);
      } else {
        tier2Conflicts.push(conflict);
      }
      conflict = this.conflicts.pop();
    }

    // Try resolving conflicts by moving against items that have the same or lower priority.
    this.conflicts = new SeqSet(tier2Conflicts);
    conflict = this.conflicts.pop();
    while (conflict) {
      // Ignoring blocked items - those must stay in place.
      if (this.blocks.has(conflict)) {
        conflict = this.conflicts.pop();
        continue;
      }

      const nextMove = this.tryFindPriorityMove(conflict, interactiveId);
      if (nextMove) {
        this.grid.move(nextMove.itemId, nextMove.x, nextMove.y, (conflictId) => this.conflicts.add(conflictId));
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
        throw new Error("Invalid move: only possible to move item one cell at a time.");
    }
  }

  // Retrieve all possible moves for the given direction (same direction but different length).
  private getMovesForDirection(
    moveTarget: Item,
    conflict: DndItem,
    direction: Direction,
    moveType: CommittedMove["type"]
  ): CommittedMove[] {
    switch (direction) {
      case "top": {
        const conflictTop = conflict.y;
        const targetBottom = conflictTop;
        const targetTop = targetBottom - (moveTarget.height - 1);

        const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: targetTop - i, x: moveTarget.x, type: moveType });
        }

        return moves;
      }

      case "bottom": {
        const conflictBottom = conflict.y + conflict.height - 1;
        const targetBottom = conflictBottom;

        const distance = Math.max(1, Math.abs(conflict.y - conflict.originalY));
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: targetBottom + i, x: moveTarget.x, type: moveType });
        }

        return moves;
      }

      case "left": {
        const conflictLeft = conflict.x;
        const targetRight = conflictLeft;
        const targetLeft = targetRight - (moveTarget.width - 1);

        const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX));
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft - i, type: moveType });
        }

        return moves;
      }

      case "right": {
        const conflictRight = conflict.x + conflict.width - 1;
        const targetLeft = conflictRight;

        const distance = Math.max(1, Math.abs(conflict.x - conflict.originalX));
        const moves: CommittedMove[] = [];
        for (let i = distance; i >= 0; i--) {
          moves.push({ itemId: moveTarget.id, y: moveTarget.y, x: targetLeft + i, type: moveType });
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

  private validateMoveCommand({ itemId, path }: MoveCommand): void {
    const moveTarget = this.grid.getItem(itemId);
    const steps = new Set<string>();

    let prevX = moveTarget.x;
    let prevY = moveTarget.y;
    for (const step of path) {
      const diffVertical = step.y - prevY;
      const diffHorizontal = step.x - prevX;
      if (Math.abs(diffVertical) + Math.abs(diffHorizontal) !== 1) {
        throw new Error("Invalid move: must move one step at a time.");
      }

      const stepKey = `${step.x}:${step.y}`;
      if (steps.has(stepKey)) {
        throw new Error("Invalid move: path steps must not repeat.");
      }
      steps.add(stepKey);

      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > this.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }

      prevX = step.x;
      prevY = step.y;
    }
  }

  private validateResizeCommand({ itemId, width, height }: ResizeCommand): void {
    const resizeTarget = this.grid.getItem(itemId);

    if (width < 1 || height < 1 || resizeTarget.x + width > this.grid.width) {
      throw new Error("Invalid resize: outside grid.");
    }
  }
}
