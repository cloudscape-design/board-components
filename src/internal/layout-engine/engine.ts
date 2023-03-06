// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { StackSet } from "../utils/stack-set";
import { findConflicts } from "./engine-conflicts";
import { LayoutEngineStep } from "./engine-step";
import { LayoutEngineGrid } from "./grid";
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

      this.conflicts = findConflicts(move, this.grid);

      this.makeMove(move);

      this.resolveOverlaps(itemId);
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

      this.resolveOverlaps(itemId, true);
    }

    return new LayoutEngine(this);
  }

  insert({ itemId, width, height, path: [position, ...path] }: InsertCommand): LayoutEngine {
    this.cleanup();

    this.grid.insert({ id: itemId, ...position, width, height }, this.addOverlap.bind(this));

    this.moves.push({ itemId, ...position, width, height, type: "INSERT" });

    this.resolveOverlaps(itemId);

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
      const step = new LayoutEngineStep(this.grid, this.moves, this.priority, this.overlaps, this.conflicts);
      step.refloatGrid();
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

  private makeMove(move: CommittedMove): void {
    this.grid.move(move.itemId, move.x, move.y, this.addOverlap.bind(this));
    this.moves.push(move);
  }

  private addOverlap(itemId: ItemId): void {
    if (!this.conflicts.has(itemId)) {
      this.overlaps.push(itemId);
    }
  }

  // Issue moves on overlapping items trying to resolve all of them.
  private resolveOverlaps(activeId: ItemId, resize = false): void {
    const step = new LayoutEngineStep(this.grid, this.moves, this.priority, this.overlaps, this.conflicts);
    step.resolveOverlaps(activeId, resize);
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
