// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ROW_SPAN } from "../../internal/constants";
import { Direction, ItemId } from "../../internal/interfaces";
import { BoardProps, OperationPerformedAnnouncement, Transition, TransitionAnnouncement } from "../interfaces";

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

export function announcementToString<D>(
  transitionAnnouncement: TransitionAnnouncement,
  items: readonly BoardProps.Item<D>[],
  acquiredItem: null | BoardProps.Item<D>,
  i18nStrings: BoardProps.I18nStrings<D>
) {
  if (!acquiredItem && !items.some((it) => it.id === transitionAnnouncement.itemId)) {
    return "";
  }

  const toItem = (id: ItemId) => [...items, acquiredItem].find((it) => it?.id === id)!;
  const formatDirection = (direction: null | Direction) => {
    if (!direction) {
      return null;
    }
    return direction === "left" || direction === "right" ? "horizontal" : "vertical";
  };

  function getOperationState(announcement: OperationPerformedAnnouncement): BoardProps.OperationState<D> {
    const item = toItem(announcement.itemId);
    const placement = { ...announcement.targetItem };
    const direction = formatDirection(announcement.direction);
    const conflicts = [...announcement.conflicts].map(toItem);
    const disturbed = [...announcement.disturbed].map(toItem);

    switch (announcement.operation) {
      case "reorder":
        return { operationType: "reorder", item, placement, direction: direction!, conflicts, disturbed };
      case "insert":
        return { operationType: "insert", item, placement, conflicts, disturbed };
      case "resize":
        return {
          operationType: "resize",
          item,
          placement,
          direction: direction!,
          isMinimalColumnsReached: placement.width === (item.definition.minColumnSpan ?? 1),
          isMinimalRowsReached: placement.height === (item.definition.minRowSpan ?? MIN_ROW_SPAN),
          conflicts,
          disturbed,
        };
    }
  }

  switch (transitionAnnouncement.type) {
    case "operation-started":
      return i18nStrings.liveAnnouncementOperationStarted(transitionAnnouncement.operation);
    case "operation-performed":
      return i18nStrings.liveAnnouncementOperation(getOperationState(transitionAnnouncement));
    case "operation-committed":
      return i18nStrings.liveAnnouncementOperationCommitted(transitionAnnouncement.operation);
    case "operation-discarded":
      return i18nStrings.liveAnnouncementOperationDiscarded(transitionAnnouncement.operation);
    case "item-removed":
      return i18nStrings.liveAnnouncementOperation({
        operationType: "remove",
        item: toItem(transitionAnnouncement.itemId),
        disturbed: [...transitionAnnouncement.disturbed].map(toItem),
      });
  }
}
