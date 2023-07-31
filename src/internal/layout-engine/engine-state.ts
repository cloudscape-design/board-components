// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction, ItemId } from "../interfaces";
import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";

/**
 * The class describes the layout engine state at a particular path step.
 * The state of the last performed step is the command result.
 */
export class LayoutEngineState {
  public grid: ReadonlyLayoutEngineGrid;
  public moves: readonly CommittedMove[];
  public conflicts: null | Conflicts;

  constructor(grid: LayoutEngineGrid, moves = new Array<CommittedMove>(), conflicts: null | Conflicts = null) {
    this.grid = grid;
    this.moves = moves;
    this.conflicts = conflicts;
  }
}

export interface Conflicts {
  items: ReadonlySet<ItemId>;
  direction: Direction;
}
