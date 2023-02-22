// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridContext } from "../../internal/grid/interfaces";
import { GridLayout, ItemId, Transform } from "../../internal/interfaces";
import { CommittedMove } from "../../internal/layout-engine/interfaces";

/**
 * Creates a mapping of between items and transforms to be applied while in transition.
 */
export function createTransforms(grid: GridLayout, moves: readonly CommittedMove[], gridContext: GridContext) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.items.find((prev) => prev.id === move.itemId);

    if (move.type === "REMOVE") {
      transforms[move.itemId] = { type: "remove" };
    } else if (item) {
      transforms[item.id] = {
        type: "move",
        x: gridContext.getColOffset(move.x - item.x),
        y: gridContext.getRowOffset(move.y - item.y),
        width: gridContext.getWidth(move.width),
        height: gridContext.getHeight(move.height),
      };
    }
  }

  return transforms;
}
