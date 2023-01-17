// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Direction } from "../../internal/interfaces";
import { Transition, TransitionAnnouncement } from "../interfaces";

export function createOperationAnnouncement<D>(
  transition: Transition<D>,
  direction: null | Direction
): null | TransitionAnnouncement {
  const { operation, layoutShift, layoutShiftWithRefloat, itemsLayout } = transition;
  const targetItem = itemsLayout.items.find((it) => it.id === transition.draggableItem.id) ?? null;

  if (!layoutShift || !layoutShiftWithRefloat) {
    return null;
  }

  const firstMove = layoutShift.moves[0];
  const targetId = firstMove?.itemId ?? targetItem?.id;
  if (!targetId) {
    return null;
  }

  const itemMoves = layoutShift.moves.filter((m) => m.itemId === targetId);
  const lastItemMove = itemMoves[itemMoves.length - 1];
  const placement = lastItemMove ?? targetItem;

  const conflicts = new Set(layoutShift.conflicts);

  const disturbed = new Set(layoutShiftWithRefloat.moves.map((move) => move.itemId));
  disturbed.delete(targetId);

  return {
    type: "operation-performed",
    itemId: targetId,
    operation,
    targetItem: {
      id: targetId,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    },
    direction,
    conflicts,
    disturbed,
  };
}
