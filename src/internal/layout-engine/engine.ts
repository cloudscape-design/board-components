// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GridLayout, ItemId } from "../interfaces";
import { Position } from "../utils/position";
import { LayoutEngineCacheNode } from "./engine-cache";
import { LayoutEngineState } from "./engine-state";
import { resolveOverlaps } from "./engine-step";
import { LayoutEngineGrid } from "./grid";
import { InsertCommand, LayoutShift, MoveCommand, ResizeCommand } from "./interfaces";
import { createMove, normalizeMovePath, normalizeResizePath, sortGridItems } from "./utils";

/**
 * Layout engine is an abstraction to compute effects of user actions (move, resize, insert, remove).
 * The engine is initialized with the board state and then takes a command to calculate the respective layout shift.
 * Use a single engine instance until the user commits their move to take advantage of the internal cache.
 * Once user move is committed the layout engine needs to be re-initialized with the updated layout state.
 */
export class LayoutEngine {
  private layout: GridLayout;
  private cache: LayoutEngineCacheNode;

  constructor(layout: GridLayout) {
    this.layout = layout;
    this.cache = new LayoutEngineCacheNode(new LayoutEngineState(new LayoutEngineGrid(layout.items, layout.columns)));
  }

  move(moveCommand: MoveCommand): LayoutShift {
    const { itemId, path } = this.validateMoveCommand(moveCommand);

    let cache = this.cache;
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const item = cache.state.grid.getItem(itemId);
      const move = createMove("MOVE", item, path[stepIndex]);
      cache = cache.matches(path[stepIndex], () => resolveOverlaps(cache.state, move));
    }

    return this.getLayoutShift(cache.state);
  }

  resize(resize: ResizeCommand): LayoutShift {
    const { itemId, path } = this.validateResizeCommand(resize);

    let cache = this.cache;
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const resizeTarget = cache.state.grid.getItem(itemId);
      const width = path[stepIndex].x - resizeTarget.x;
      const height = path[stepIndex].y - resizeTarget.y;
      const move = createMove("RESIZE", resizeTarget, new Position({ x: width, y: height }));
      cache = cache.matches(path[stepIndex], () => resolveOverlaps(cache.state, move));
    }

    return this.getLayoutShift(cache.state);
  }

  insert({ itemId, width, height, path: [position, ...path] }: InsertCommand): LayoutShift {
    const insertMove = createMove("INSERT", { id: itemId, x: position.x, y: position.y, width, height }, position);
    let cache = this.cache;
    cache = cache.matches(position, () => resolveOverlaps(cache.state, insertMove));

    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const item = cache.state.grid.getItem(itemId);
      const move = createMove("MOVE", item, path[stepIndex]);
      cache = cache.matches(path[stepIndex], () => resolveOverlaps(cache.state, move));
    }

    return this.getLayoutShift(cache.state);
  }

  remove(itemId: ItemId): LayoutShift {
    const { x, y, width, height } = this.cache.state.grid.getItem(itemId);
    const move = createMove("REMOVE", { id: itemId, x, y, width, height }, new Position({ x, y }));
    const state = resolveOverlaps(this.cache.state, move);
    return this.getLayoutShift(state);
  }

  private getLayoutShift(state: LayoutEngineState): LayoutShift {
    return {
      current: this.layout,
      next: {
        items: sortGridItems(state.grid.items),
        columns: state.grid.width,
        rows: state.grid.height,
      },
      moves: [...state.moves],
      conflicts: state.conflicts ? [...state.conflicts.items.values()] : [],
    };
  }

  private validateMoveCommand({ itemId, path }: MoveCommand): MoveCommand {
    const moveTarget = this.cache.state.grid.getItem(itemId);

    for (const step of path) {
      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > this.cache.state.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }
    }

    return { itemId, path: normalizeMovePath(new Position({ x: moveTarget.x, y: moveTarget.y }), path) };
  }

  private validateResizeCommand({ itemId, path }: ResizeCommand): ResizeCommand {
    const resizeTarget = this.cache.state.grid.getItem(itemId);
    const x = resizeTarget.x + resizeTarget.width;
    const y = resizeTarget.y + resizeTarget.height;

    for (const step of path) {
      if (step.x < 1 || step.y < 1) {
        throw new Error("Invalid resize: can't resize to 0.");
      }
      if (step.x > this.cache.state.grid.width) {
        throw new Error("Invalid resize: outside grid.");
      }
    }

    return { itemId, path: normalizeResizePath(new Position({ x, y }), path) };
  }
}
