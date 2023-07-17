// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { LayoutEngineStepState, refloatGrid, resolveOverlaps } from "./engine-step";
import { LayoutEngineGrid } from "./grid";
import { InsertCommand, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { createMove, normalizeMovePath, normalizeResizePath, sortGridItems } from "./utils";

class LayoutEngineCacheNode {
  public position: null | Position = null;
  public value: null | LayoutEngineStepState = null;
  private next = new Array<LayoutEngineCacheNode>();

  matches(position: Position): LayoutEngineCacheNode {
    for (const nextNode of this.next) {
      if (nextNode.position!.x === position.x && nextNode.position!.y === position.y) {
        return nextNode;
      }
    }

    const nextNode = new LayoutEngineCacheNode();
    nextNode.position = position;
    this.next.push(nextNode);

    return nextNode;
  }
}

export class LayoutEngine {
  private current: GridLayout;
  private step: LayoutEngineStepState;
  private cache: LayoutEngineCacheNode;
  private chained = false;

  constructor(args: GridLayout | LayoutEngine) {
    if (args instanceof LayoutEngine) {
      this.current = args.current;
      this.step = args.step;
      this.cache = new LayoutEngineCacheNode();
      this.chained = true;
    } else {
      this.current = args;
      this.step = new LayoutEngineStepState(new LayoutEngineGrid(args.items, args.columns));
      this.cache = new LayoutEngineCacheNode();
    }
  }

  move(moveCommand: MoveCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateMoveCommand(moveCommand);

    let cache = this.cache;
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      cache = cache.matches(path[stepIndex]);
      const item = this.step.grid.getItem(itemId);
      const move = createMove("MOVE", item, path[stepIndex]);
      cache.value = cache.value ?? resolveOverlaps(this.step, move);
      this.step = cache.value;
    }

    return new LayoutEngine(this);
  }

  resize(resize: ResizeCommand): LayoutEngine {
    this.cleanup();

    const { itemId, path } = this.validateResizeCommand(resize);

    let cache = this.cache;
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      cache = cache.matches(path[stepIndex]);
      const resizeTarget = this.step.grid.getItem(itemId);
      const width = path[stepIndex].x - resizeTarget.x;
      const height = path[stepIndex].y - resizeTarget.y;
      const move = createMove("RESIZE", resizeTarget, new Position({ x: width, y: height }));
      cache.value = cache.value ?? resolveOverlaps(this.step, move);
      this.step = cache.value;
    }

    return new LayoutEngine(this);
  }

  insert({ itemId, width, height, path: [position, ...path] }: InsertCommand): LayoutEngine {
    this.cleanup();

    const cache = this.cache.matches(position);
    cache.value =
      cache.value ??
      resolveOverlaps(
        this.step,
        createMove("INSERT", { id: itemId, x: position.x, y: position.y, width, height }, position)
      );
    this.step = cache.value;

    return new LayoutEngine(this).move({ itemId, path });
  }

  remove(itemId: ItemId): LayoutEngine {
    this.cleanup();

    const { x, y, width, height } = this.step.grid.getItem(itemId);

    this.step = resolveOverlaps(
      this.step,
      createMove("REMOVE", { id: itemId, x, y, width, height }, new Position({ x, y }))
    );

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
      conflicts: this.step.conflicts ? [...this.step.conflicts.items.values()] : [],
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
