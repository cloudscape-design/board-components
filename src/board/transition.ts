// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Dispatch, useReducer } from "react";
import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import { BoardItemDefinitionBase, Direction, GridLayout, ItemId } from "../internal/interfaces";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { Coordinates } from "../internal/utils/coordinates";
import { Position } from "../internal/utils/position";
import { BoardProps, RemoveTransition, Transition, TransitionAnnouncement } from "./interfaces";
import { createOperationAnnouncement } from "./utils/announcements";
import { getHoveredRect } from "./utils/get-hovered-rect";
import {
  getDefaultItemHeight,
  getDefaultItemWidth,
  getInsertionDirection,
  getLayoutPlaceholders,
  getLayoutRows,
  getLayoutShift,
} from "./utils/layout";
import { appendMovePath, appendResizePath } from "./utils/path";

export interface TransitionState<D> {
  transition: null | Transition<D>;
  removeTransition: null | RemoveTransition<D>;
  announcement: null | TransitionAnnouncement;
}

export type Action<D> =
  | InitAction<D>
  | InitRemoveAction<D>
  | SubmitAction
  | DiscardAction
  | UpdateWithPointerAction
  | UpdateWithKeyboardAction
  | AcquireItemAction;

interface InitAction<D> {
  type: "init";
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  draggableItem: BoardItemDefinitionBase<D>;
  draggableElement: HTMLElement;
  collisionIds: readonly ItemId[];
}
interface InitRemoveAction<D> {
  type: "init-remove";
  items: readonly BoardProps.Item<D>[];
  removedItem: BoardItemDefinitionBase<D>;
  itemsLayout: GridLayout;
}
interface SubmitAction {
  type: "submit";
}
interface DiscardAction {
  type: "discard";
}
interface UpdateWithPointerAction {
  type: "update-with-pointer";
  collisionIds: readonly ItemId[];
  positionOffset: Coordinates;
}
interface UpdateWithKeyboardAction {
  type: "update-with-keyboard";
  direction: Direction;
}
interface AcquireItemAction {
  type: "acquire-item";
  position: Position;
  layoutElement: HTMLElement;
}

export function useTransition<D>(): [TransitionState<D>, Dispatch<Action<D>>] {
  return useReducer(transitionReducer<D>, { transition: null, removeTransition: null, announcement: null });
}

export function selectTransitionRows<D>(state: TransitionState<D>) {
  return state.transition ? getLayoutRows(state.transition) : 0;
}

function transitionReducer<D>(state: TransitionState<D>, action: Action<D>): TransitionState<D> {
  switch (action.type) {
    case "init":
      return initTransition(action);
    case "init-remove":
      return initRemoveTransition(action);
    case "submit":
      return submitTransition(state);
    case "discard":
      return discardTransition(state);
    case "update-with-pointer":
      return updateTransitionWithPointerEvent(state, action);
    case "update-with-keyboard":
      return updateTransitionWithKeyboardEvent(state, action);
    case "acquire-item":
      return acquireTransitionItem(state, action);
  }
}

function initTransition<D>({
  operation,
  interactionType,
  itemsLayout,
  draggableItem,
  draggableElement,
  collisionIds,
}: InitAction<D>): TransitionState<D> {
  const transition: Transition<D> = {
    operation,
    interactionType,
    itemsLayout,
    insertionDirection: null,
    draggableItem,
    draggableElement,
    acquiredItem: null,
    collisionIds: new Set(),
    layoutShift: null,
    path: [],
  };

  const placeholdersLayout = getLayoutPlaceholders(transition);

  const itemBelongsToBoard = itemsLayout.items.find((it) => it.id === draggableItem.id);
  const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
  const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
  const path = itemBelongsToBoard ? appendPath([], collisionRect) : [];

  return {
    transition: { ...transition, path },
    removeTransition: null,
    announcement: itemBelongsToBoard ? { type: "operation-started", item: draggableItem, operation } : null,
  };
}

function initRemoveTransition<D>({ items, removedItem, itemsLayout }: InitRemoveAction<D>): TransitionState<D> {
  const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).refloat().getLayoutShift();
  const removeTransition: RemoveTransition<D> = { items, removedItem, layoutShift };
  return { transition: null, removeTransition, announcement: null };
}

function submitTransition<D>(state: TransitionState<D>): TransitionState<D> {
  const { transition, removeTransition } = state;

  if (removeTransition) {
    const disturbed = new Set(removeTransition.layoutShift.moves.map((move) => move.itemId));
    disturbed.delete(removeTransition.removedItem.id);
    return {
      transition: null,
      removeTransition: null,
      announcement: { type: "item-removed", item: removeTransition.removedItem, disturbed },
    };
  }

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const { operation, itemsLayout, draggableItem: item, acquiredItem } = transition;
  const itemBelongsToBoard = item.id === acquiredItem?.id || itemsLayout.items.some((it) => it.id === item.id);

  return transition.layoutShift?.conflicts.length === 0
    ? {
        transition: null,
        removeTransition: null,
        announcement: itemBelongsToBoard ? { type: "operation-committed", item, operation } : null,
      }
    : {
        transition: null,
        removeTransition: null,
        announcement: itemBelongsToBoard ? { type: "operation-discarded", item, operation } : null,
      };
}

function discardTransition<D>(state: TransitionState<D>): TransitionState<D> {
  const { transition, removeTransition } = state;

  if (removeTransition) {
    throw new Error("Can't discard remove transition.");
  }

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const { operation, itemsLayout, draggableItem: item, acquiredItem } = transition;
  const itemBelongsToBoard = item.id === acquiredItem?.id || itemsLayout.items.some((it) => it.id === item.id);

  return {
    transition: null,
    removeTransition: null,
    announcement: itemBelongsToBoard ? { type: "operation-discarded", item, operation } : null,
  };
}

function updateTransitionWithPointerEvent<D>(
  state: TransitionState<D>,
  { collisionIds, positionOffset }: UpdateWithPointerAction
): TransitionState<D> {
  const { transition } = state;

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const layout = transition.layoutShift?.next ?? transition.itemsLayout;
  const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
  const itemWidth = layoutItem ? layoutItem.width : getDefaultItemWidth(transition.draggableItem, layout.columns);
  const itemHeight = layoutItem ? layoutItem.height : getDefaultItemHeight(transition.draggableItem);
  const itemSize = itemWidth * itemHeight;

  const isOutOfBoundaries =
    transition.operation !== "resize" ? collisionIds.length < itemSize : collisionIds.length === 0;

  if (isOutOfBoundaries) {
    return {
      transition: { ...transition, collisionIds: new Set(), layoutShift: null, insertionDirection: null },
      removeTransition: null,
      announcement: null,
    };
  }

  const placeholdersLayout = getLayoutPlaceholders(transition);
  const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
  const appendPath = transition.operation === "resize" ? appendResizePath : appendMovePath;
  const path = appendPath(transition.path, collisionRect);

  const insertionDirection = transition.insertionDirection ?? getInsertionDirection(positionOffset);
  const layoutShift = getLayoutShift(transition, path, insertionDirection);

  return {
    transition: { ...transition, collisionIds: new Set(collisionIds), layoutShift, path, insertionDirection },
    removeTransition: null,
    announcement: null,
  };
}

function updateTransitionWithKeyboardEvent<D>(
  state: TransitionState<D>,
  { direction }: UpdateWithKeyboardAction
): TransitionState<D> {
  const { transition } = state;

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const updateManualItemTransition = (transition: Transition<D>, direction: Direction): TransitionState<D> => {
    const xDelta = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const yDelta = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const lastPosition = transition.path[transition.path.length - 1];
    const nextPosition = new Position({ x: lastPosition.x + xDelta, y: lastPosition.y + yDelta });
    const nextPath = [...transition.path, nextPosition];
    try {
      const layoutShift = getLayoutShift(transition, nextPath);
      const nextTransition = { ...transition, layoutShift, path: nextPath };
      return {
        transition: nextTransition,
        removeTransition: null,
        announcement: createOperationAnnouncement(nextTransition, direction),
      };
    } catch {
      // Can't create next layout because the next path is out of bounds.
      return state;
    }
  };

  switch (direction) {
    case "left":
      return updateManualItemTransition(transition, "left");
    case "right":
      return updateManualItemTransition(transition, "right");
    case "up":
      return updateManualItemTransition(transition, "up");
    case "down":
      return updateManualItemTransition(transition, "down");
  }
}

function acquireTransitionItem<D>(
  state: TransitionState<D>,
  { position, layoutElement }: AcquireItemAction
): TransitionState<D> {
  const { transition } = state;

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const { columns } = transition.itemsLayout;

  const layoutRect = layoutElement.getBoundingClientRect();
  const itemRect = transition.draggableElement.getBoundingClientRect();
  const offset = new Coordinates({ x: itemRect.x - layoutRect.x, y: itemRect.y - layoutRect.y });
  const insertionDirection = getInsertionDirection(offset);

  // Update original insertion position if the item can't fit into the layout by width.
  const width = getDefaultItemWidth(transition.draggableItem, columns);
  position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

  const path = [...transition.path, position];

  const layoutShift = getLayoutShift(transition, path, insertionDirection);

  // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
  const acquiredItem = { ...transition.draggableItem, columnOffset: 0, columnSpan: 1, rowSpan: 1 };

  const nextTransition: Transition<D> = { ...transition, collisionIds: new Set(), layoutShift, path, acquiredItem };
  return {
    transition: nextTransition,
    removeTransition: null,
    announcement: createOperationAnnouncement(nextTransition, null),
  };
}
