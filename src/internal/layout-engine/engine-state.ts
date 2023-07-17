// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LayoutEngineGrid, ReadonlyLayoutEngineGrid } from "./grid";
import { CommittedMove, Conflicts } from "./interfaces";

/**
 * The user commands in the layout engine are applied step by step.
 * The class describes the layout engine state at a particular step.
 * The state of the last performed state describes the command result.
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
