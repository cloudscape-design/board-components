// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { MIN_ROW_SPAN } from "../../internal/constants";
import { Direction, ItemId } from "../../internal/interfaces";
import {
  BoardProps,
  ItemRemovedAnnouncement,
  OperationPerformedAnnouncement,
  Transition,
  TransitionAnnouncement,
} from "../interfaces";

/**
 * Creates an announcement object describing the last user move.
 */
export function createOperationAnnouncement<D>(
  transition: Transition<D>,
  direction: null | Direction
): null | OperationPerformedAnnouncement {
  const { operation, layoutShift, itemsLayout } = transition;
  const targetItem = itemsLayout.items.find((it) => it.id === transition.draggableItem.id) ?? null;

  if (!layoutShift) {
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

  const disturbed = new Set(layoutShift.moves.map((move) => move.itemId));
  disturbed.delete(targetId);

  return {
    type: "operation-performed",
    item: transition.draggableItem,
    operation,
    placement: {
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

/**
 * Applies i18nStrings to the announcement object to produce a string for the live region.
 */
export function announcementToString<D>(
  announcement: TransitionAnnouncement,
  items: readonly BoardProps.Item<D>[],
  i18nStrings: BoardProps.I18nStrings<D>
): string {
  if (!announcement) {
    return "";
  }
  const item = announcement.item as BoardProps.Item<D>;

  const toItem = (id: ItemId) => items.find((it) => it?.id === id)!;
  const formatDirection = (direction: null | Direction) => {
    if (!direction) {
      return null;
    }
    return direction === "left" || direction === "right" ? "horizontal" : "vertical";
  };

  function createOperationPerformedAnnouncement(announcement: OperationPerformedAnnouncement) {
    const placement = announcement.placement;
    const direction = formatDirection(announcement.direction);
    const conflicts = [...announcement.conflicts].map(toItem);
    const disturbed = [...announcement.disturbed].map(toItem);

    switch (announcement.operation) {
      case "reorder":
        return i18nStrings.liveAnnouncementOperationReorder({
          item,
          placement,
          direction: direction!,
          conflicts,
          disturbed,
        });
      case "resize":
        return i18nStrings.liveAnnouncementOperationResize({
          item,
          placement,
          direction: direction!,
          isMinimalColumnsReached: placement.width === (item.definition.minColumnSpan ?? 1),
          isMinimalRowsReached: placement.height === (item.definition.minRowSpan ?? MIN_ROW_SPAN),
          conflicts,
          disturbed,
        });
      case "insert":
        return i18nStrings.liveAnnouncementOperationInsert({ item, placement, conflicts, disturbed });
    }
  }

  function createItemRemovedAnnouncement(announcement: ItemRemovedAnnouncement) {
    return i18nStrings.liveAnnouncementOperationRemove({ item, disturbed: [...announcement.disturbed].map(toItem) });
  }

  switch (announcement.type) {
    case "operation-started":
      return i18nStrings.liveAnnouncementOperationStarted(announcement.operation);
    case "operation-performed":
      return createOperationPerformedAnnouncement(announcement);
    case "operation-committed":
      return i18nStrings.liveAnnouncementOperationCommitted(announcement.operation);
    case "operation-discarded":
      return i18nStrings.liveAnnouncementOperationDiscarded(announcement.operation);
    case "item-removed":
      return createItemRemovedAnnouncement(announcement);
  }
}
