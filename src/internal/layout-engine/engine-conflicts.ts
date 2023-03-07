// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ItemId } from "../interfaces";
import { LayoutEngineGrid } from "./grid";
import { CommittedMove } from "./interfaces";

// Find items that the active item cannot be moved over with the current move.
export function findConflicts(move: CommittedMove, grid: LayoutEngineGrid): Set<ItemId> {
  const conflicts = new Set<ItemId>();

  const moveTarget = grid.getItem(move.itemId);
  const direction = `${move.x - moveTarget.x}:${move.y - moveTarget.y}`;

  switch (direction) {
    case "-1:0": {
      const left = Math.max(0, moveTarget.left - 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getCellOverlap(left, y, moveTarget.id);
        if (block && block.x < left) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "1:0": {
      const right = Math.min(grid.width - 1, moveTarget.right + 1);
      for (let y = moveTarget.y; y < moveTarget.y + moveTarget.height; y++) {
        const block = grid.getCellOverlap(right, y, moveTarget.id);
        if (block && block.x + block.width - 1 > right) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "0:-1": {
      const top = Math.max(0, moveTarget.top - 1);
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getCellOverlap(x, top, moveTarget.id);
        if (block && block.y < top) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    case "0:1": {
      const bottom = moveTarget.bottom + 1;
      for (let x = moveTarget.x; x < moveTarget.x + moveTarget.width; x++) {
        const block = grid.getCellOverlap(x, bottom, moveTarget.id);
        if (block && block.y + block.height - 1 > bottom) {
          conflicts.add(block.id);
        }
      }
      break;
    }
    default:
      throw new Error(`Invariant violation: unexpected direction ${direction}.`);
  }

  return conflicts;
}
