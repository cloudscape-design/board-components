// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LayoutShift } from "../../internal/layout-engine/interfaces";
import { createCustomEvent } from "../../internal/utils/events";
import { transformItems } from "../../internal/utils/layout";
import { BoardProps } from "../interfaces";

export function createItemsChangeEvent<D>(
  items: readonly BoardProps.Item<D>[],
  layoutShift: LayoutShift
): CustomEvent<BoardProps.ItemsChangeDetail<D>> {
  const insertTarget = layoutShift.moves.find((move) => move.type === "INSERT")?.itemId ?? null;
  const moveTarget = layoutShift.moves.find((move) => move.type === "MOVE")?.itemId ?? null;
  const removeTarget = layoutShift.moves.find((move) => move.type === "REMOVE")?.itemId ?? null;
  const resizeTarget = layoutShift.moves.find((move) => move.type === "RESIZE")?.itemId ?? null;

  const newItems = transformItems(items, layoutShift.next, resizeTarget ?? insertTarget);

  return createCustomEvent({
    items: newItems,
    addedItem: newItems.find((it) => it.id === insertTarget),
    removedItem: newItems.find((it) => it.id === removeTarget),
    resizedItem: newItems.find((it) => it.id === resizeTarget),
    movedItem: !insertTarget ? newItems.find((it) => it.id === moveTarget) : undefined,
  });
}
