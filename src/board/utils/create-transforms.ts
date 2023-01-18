// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { GridLayout, ItemId, Transform } from "../../internal/interfaces";
import { CommittedMove } from "../../internal/layout-engine/interfaces";

export function createTransforms(grid: GridLayout, moves: readonly CommittedMove[]) {
  const transforms: Record<ItemId, Transform> = {};

  for (const move of moves) {
    const item = grid.items.find((prev) => prev.id === move.itemId);

    if (move.type === "REMOVE") {
      transforms[move.itemId] = { type: "remove" };
    } else if (item) {
      transforms[item.id] = {
        type: "move",
        x: move.x - item.x,
        y: move.y - item.y,
        width: move.width,
        height: move.height,
      };
    }
  }

  return transforms;
}
