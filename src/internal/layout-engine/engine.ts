// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { LayoutEngineStepState, refloatGrid, resolveOverlaps } from "./engine-step";
import { LayoutEngineGrid } from "./grid";
import { CommittedMove, InsertCommand, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { normalizeMovePath, normalizeResizePath, sortGridItems } from "./utils";

export class LayoutEngine {
  private current: GridLayout;
  private step: LayoutEngineStepState;
  private chained = false;

  constructor(args: GridLayout | LayoutEngine) {
    if (args instanceof LayoutEngine) {
      this.current = args.current;
      this.step = args.step;
      this.chained = true;
    } else {
      this.current = args;
      this.step = new LayoutEngineStepState(new LayoutEngineGrid(args.items, args.columns));
    }
  }

  move(moveCommand: MoveCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateMoveCommand(moveCommand);

    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const step = path[stepIndex];
      const { width, height } = this.step.grid.getItem(itemId);

      const move: CommittedMove = { itemId, x: step.x, y: step.y, width, height, type: "MOVE" };
      this.step = resolveOverlaps(move, this.step);
    }

    return new LayoutEngine(this);
  }

  resize(resize: ResizeCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateResizeCommand(resize);
    const resizeTarget = this.step.grid.getItem(itemId);

    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const width = path[stepIndex].x - resizeTarget.x;
      const height = path[stepIndex].y - resizeTarget.y;

      this.step = resolveOverlaps(
        { itemId, x: resizeTarget.x, y: resizeTarget.y, width, height, type: "RESIZE" },
        this.step
      );
    }

    return new LayoutEngine(this);
  }

  insert({ itemId, width, height, path: [position, ...path] }: InsertCommand): LayoutEngine {
    this.cleanup();

    this.step = resolveOverlaps({ itemId, ...position, width, height, type: "INSERT" }, this.step);

    return new LayoutEngine(this).move({ itemId, path });
  }

  remove(itemId: ItemId): LayoutEngine {
    this.cleanup();

    const { x, y, width, height } = this.step.grid.getItem(itemId);

    this.step = resolveOverlaps({ itemId, x, y, width, height, type: "REMOVE" }, this.step);

    return new LayoutEngine(this);
  }

  refloat(): LayoutEngine {
    this.step = refloatGrid(this.step);
    return new LayoutEngine(this);
  }

  getLayoutShift(): LayoutShift {
    return {
      current: this.current,
      next: {
        items: sortGridItems(this.step.grid.items.map((item) => ({ ...item }))),
        columns: this.step.grid.width,
        rows: this.step.grid.height,
      },
      moves: [...this.step.moves],
      conflicts: [...this.step.conflicts],
    };
  }

  private cleanup(): void {
    if (!this.chained) {
      this.step = new LayoutEngineStepState(new LayoutEngineGrid(this.current.items, this.current.columns));
    }
  }

  private validateMoveCommand({ itemId, path }: MoveCommand): MoveCommand {
    const moveTarget = this.step.grid.getItem(itemId);

    for (const step of path) {
      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > this.step.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }
    }

    return { itemId, path: normalizeMovePath(new Position({ x: moveTarget.x, y: moveTarget.y }), path) };
  }

  private validateResizeCommand({ itemId, path }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.step.grid.getItem(itemId);
    const x = resizeTarget.x + resizeTarget.width;
    const y = resizeTarget.y + resizeTarget.height;

    for (const step of path) {
      if (step.x < 1 || step.y < 1) {
        throw new Error("Invalid resize: can't resize to 0.");
      }
      if (step.x > this.step.grid.width) {
        throw new Error("Invalid resize: outside grid.");
      }
    }

    return { itemId, path: normalizeResizePath(new Position({ x, y }), path) };
  }
}
