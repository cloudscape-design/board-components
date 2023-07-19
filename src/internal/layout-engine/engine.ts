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

  move(moveCommand: MoveCommand, cache = this.cache): LayoutShift {
    // The validation ensures no position in the path is outside the board and updates the path so that all
    // positions are incremental (moving one cell at a time) and no loops are present (no position can occur twice).
    // Removing the loops guarantees that moving back to one of the previous positions including the starting one
    // revives the previous state as is. The same behavior might cause confusion in case the user comes back
    // to a previous position accidentally especially if the move path is long.
    const path = this.validateMovePath({ ...moveCommand }, cache.state);

    // The user command is resolved one step at a time. When layout engine is reused withing one transition
    // it is expected that all steps but the last one are already cached.
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const item = cache.state.grid.getItem(moveCommand.itemId);
      const move = createMove("MOVE", item, path[stepIndex]);
      cache = cache.matches(path[stepIndex], () => resolveOverlaps(cache.state, move));
    }

    return this.getLayoutShift(cache.state);
  }

  resize(resizeCommand: ResizeCommand): LayoutShift {
    // The validation ensures no position in the path is outside the board and the width/height are above 0.
    // The resize path is updated so that all positions are incremental (moving one cell at a time) and
    // no loops are present (no position can occur twice).
    // Removing the loops guarantees that moving back to one of the previous positions including the starting one
    // revives the previous state as is. The same behavior might cause confusion in case the user comes back
    // to a previous position accidentally especially if the move path is long.
    const path = this.validateResizePath(resizeCommand, this.cache.state);

    // The user command is resolved one step at a time. When layout engine is reused withing one transition
    // it is expected that all steps but the last one are already cached.
    let cache = this.cache;
    for (let stepIndex = 0; stepIndex < path.length; stepIndex++) {
      const resizeTarget = cache.state.grid.getItem(resizeCommand.itemId);
      const width = path[stepIndex].x - resizeTarget.x;
      const height = path[stepIndex].y - resizeTarget.y;
      const move = createMove("RESIZE", resizeTarget, new Position({ x: width, y: height }));
      cache = cache.matches(path[stepIndex], () => resolveOverlaps(cache.state, move));
    }

    return this.getLayoutShift(cache.state);
  }

  insert({ itemId, width, height, path: [position, ...movePath] }: InsertCommand): LayoutShift {
    // For insert command the new item is injected to the given location first and then it can be moved
    // the same way as the existing item would.
    const insertMove = createMove("INSERT", { id: itemId, x: position.x, y: position.y, width, height }, position);
    const cache = this.cache.matches(position, () => resolveOverlaps(this.cache.state, insertMove));

    return this.move({ itemId, path: movePath }, cache);
  }

  remove(itemId: ItemId): LayoutShift {
    // The remove command does not define the move path and is not cached. It is expected to be performed only once.
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
      moves: state.moves,
      conflicts: state.conflicts ? [...state.conflicts.items] : [],
    };
  }

  private validateMovePath({ itemId, path }: MoveCommand, state: LayoutEngineState): readonly Position[] {
    const moveTarget = state.grid.getItem(itemId);
    for (const step of path) {
      if (step.x < 0 || step.y < 0 || step.x + moveTarget.width > state.grid.width) {
        throw new Error("Invalid move: outside grid.");
      }
    }
    return normalizeMovePath(new Position({ x: moveTarget.x, y: moveTarget.y }), path);
  }

  private validateResizePath({ itemId, path }: ResizeCommand, state: LayoutEngineState): readonly Position[] {
    const resizeTarget = state.grid.getItem(itemId);
    const x = resizeTarget.x + resizeTarget.width;
    const y = resizeTarget.y + resizeTarget.height;
    for (const step of path) {
      if (step.x < 1 || step.y < 1) {
        throw new Error("Invalid resize: can't resize to 0.");
      }
      if (step.x > state.grid.width) {
        throw new Error("Invalid resize: outside grid.");
      }
    }
    return normalizeResizePath(new Position({ x, y }), path);
  }
}
