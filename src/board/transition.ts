// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Dispatch, useMemo, useReducer } from "react";
import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import {
  BoardItemDefinition,
  BoardItemDefinitionBase,
  Direction,
  GridLayout,
  GridLayoutItem,
  ItemId,
} from "../internal/interfaces";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import { Coordinates } from "../internal/utils/coordinates";
import { debounce } from "../internal/utils/debounce";
import { createPlaceholdersLayout, getDefaultItemSize, getMinItemSize } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { getHoveredRect } from "./calculations/collision";
import { appendMovePath, appendResizePath, normalizeInsertionPath } from "./calculations/shift-layout";

export interface TransitionState<D> {
  transition: null | Transition<D>;
  announcement: null | Announcement;
}

export interface Transition<D> {
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  insertionDirection: null | Direction;
  draggableItem: BoardItemDefinitionBase<unknown>;
  draggableElement: HTMLElement;
  acquiredItem: null | BoardItemDefinition<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  layoutShiftWithRefloat: null | LayoutShift;
  path: readonly Position[];
}

export type Announcement =
  | OperationStartedAnnouncement
  | OperationPerformedAnnouncement
  | OperationCommittedAnnouncement
  | OperationDiscardedAnnouncement
  | ItemRemovedAnnouncement;

export interface OperationStartedAnnouncement {
  type: "operation-started";
  itemId: ItemId;
  operation: Operation;
}
export interface OperationPerformedAnnouncement {
  type: "operation-performed";
  itemId: ItemId;
  operation: Operation;
  targetItem: GridLayoutItem;
  direction: null | Direction;
  conflicts: Set<ItemId>;
  disturbed: Set<ItemId>;
}
export interface OperationCommittedAnnouncement {
  type: "operation-committed";
  itemId: ItemId;
  operation: Operation;
}
export interface OperationDiscardedAnnouncement {
  type: "operation-discarded";
  itemId: ItemId;
  operation: Operation;
}
export interface ItemRemovedAnnouncement {
  type: "item-removed";
  itemId: ItemId;
  disturbed: Set<ItemId>;
}

export type Action =
  | InitAction
  | SubmitAction
  | DiscardAction
  | UpdateWithPointerAction
  | UpdateWithKeyboardAction
  | AcquireItemAction
  | RemoveItemAction;

interface InitAction {
  type: "init";
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  draggableItem: BoardItemDefinitionBase<unknown>;
  draggableElement: HTMLElement;
  collisionIds: readonly ItemId[];
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
interface RemoveItemAction {
  type: "remove-item";
  itemsLayout: GridLayout;
  itemId: ItemId;
}

export function useTransition<D>(): [TransitionState<D>, Dispatch<Action>] {
  const [state, dispatch] = useReducer(transitionReducer, { transition: null, announcement: null });

  // Debounces pointer actions to resolve race condition between layout and items.
  const decoratedDispatch = useMemo(() => {
    const debouncedDispatch = debounce(dispatch, 10);

    return (action: Action) => {
      if (action.type === "update-with-pointer") {
        debouncedDispatch(action);
      } else {
        debouncedDispatch.cancel();
        dispatch(action);
      }
    };
  }, []);

  return [state as TransitionState<D>, decoratedDispatch];
}

export function selectTransitionRows<D>(state: TransitionState<D>) {
  return state.transition ? getLayoutRows(state.transition) : 0;
}

function transitionReducer<D>(state: TransitionState<D>, action: Action): TransitionState<D> {
  switch (action.type) {
    case "init":
      return initTransition(action);
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
    case "remove-item":
      return removeTransitionItem(action);
  }
}

function initTransition<D>({
  operation,
  interactionType,
  itemsLayout,
  draggableItem,
  draggableElement,
  collisionIds,
}: InitAction): TransitionState<D> {
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
    layoutShiftWithRefloat: null,
    path: [],
  };

  const placeholdersLayout = getLayoutPlaceholders(transition);

  const layoutItem = itemsLayout.items.find((it) => it.id === draggableItem.id);
  const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
  const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
  const path = layoutItem ? appendPath([], collisionRect) : [];

  return {
    transition: { ...transition, path },
    announcement: { type: "operation-started", itemId: draggableItem.id, operation },
  };
}

function submitTransition<D>(state: TransitionState<D>): TransitionState<D> {
  const { transition } = state;

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const {
    operation,
    draggableItem: { id: itemId },
  } = transition;

  return transition.layoutShift?.conflicts.length === 0
    ? { transition: null, announcement: { type: "operation-committed", itemId, operation } }
    : { transition: null, announcement: { type: "operation-discarded", itemId, operation } };
}

function discardTransition<D>(state: TransitionState<D>): TransitionState<D> {
  const { transition } = state;

  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const {
    operation,
    draggableItem: { id: itemId },
  } = transition;

  return { transition: null, announcement: { type: "operation-discarded", itemId, operation } };
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
  const itemWidth = layoutItem ? layoutItem.width : getItemWidth(transition);
  const itemHeight = layoutItem ? layoutItem.height : getItemHeight(transition);
  const itemSize = itemWidth * itemHeight;

  if (transition.operation !== "resize" && collisionIds.length < itemSize) {
    return {
      transition: { ...transition, collisionIds: new Set(), layoutShift: null, insertionDirection: null },
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
    transition: { ...transition, collisionIds: new Set(collisionIds), ...layoutShift, path, insertionDirection },
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

  const { itemsLayout } = transition;
  const columns = getLayoutColumns(transition);
  const rows = getLayoutRows(transition);

  const updateManualItemTransition = (transition: Transition<D>, direction: Direction): TransitionState<D> => {
    const xDelta = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    const yDelta = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const lastPosition = transition.path[transition.path.length - 1];
    const nextPosition = new Position({ x: lastPosition.x + xDelta, y: lastPosition.y + yDelta });
    const nextPath = [...transition.path, nextPosition];
    const layoutShift = getLayoutShift(transition, nextPath);
    const nextTransition = { ...transition, ...layoutShift, path: nextPath };
    return { transition: nextTransition, announcement: createOperationAnnouncement(nextTransition, direction) };
  };

  function shiftItemLeft(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.x ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).width;
    if (lastPosition.x > (transition.operation === "resize" ? position + minSize : 0)) {
      return updateManualItemTransition(transition, "left");
    } else {
      return state;
    }
  }

  function shiftItemRight(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x < (transition.operation === "resize" ? columns : columns - 1)) {
      return updateManualItemTransition(transition, "right");
    } else {
      return state;
    }
  }

  function shiftItemUp(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.y ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).height;
    if (lastPosition.y > (transition.operation === "resize" ? position + minSize : 0)) {
      return updateManualItemTransition(transition, "up");
    } else {
      return state;
    }
  }

  function shiftItemDown(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y < (transition.operation === "resize" ? 999 : rows - 1)) {
      return updateManualItemTransition(transition, "down");
    } else {
      return state;
    }
  }

  switch (direction) {
    case "left":
      return shiftItemLeft(transition);
    case "right":
      return shiftItemRight(transition);
    case "up":
      return shiftItemUp(transition);
    case "down":
      return shiftItemDown(transition);
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
  const width = getItemWidth(transition);
  position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

  const path = [...transition.path, position];

  const layoutShift = getLayoutShift(transition, path, insertionDirection);

  // TODO: resolve "any" here.
  // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
  const acquiredItem = { ...(transition.draggableItem as any), columnOffset: 0, columnSpan: 1, rowSpan: 1 };

  const nextTransition: Transition<D> = { ...transition, collisionIds: new Set(), ...layoutShift, path, acquiredItem };
  return { transition: nextTransition, announcement: createOperationAnnouncement(nextTransition, null) };
}

function removeTransitionItem<D>({ itemId, itemsLayout }: RemoveItemAction): TransitionState<D> {
  const layoutShiftWithRefloat = new LayoutEngine(itemsLayout).remove(itemId).refloat().getLayoutShift();

  const disturbed = new Set(layoutShiftWithRefloat.moves.map((move) => move.itemId));
  disturbed.delete(itemId);

  return { transition: null, announcement: { type: "item-removed", itemId, disturbed } };
}

function getItemWidth<D>(transition: Transition<D>) {
  return Math.min(transition.itemsLayout.columns, getDefaultItemSize(transition.draggableItem).width);
}

function getItemHeight<D>(transition: Transition<D>) {
  return getDefaultItemSize(transition.draggableItem).height;
}

function getLayoutColumns<D>(transition: Transition<D>) {
  return transition.itemsLayout.columns;
}

// The rows can be overridden during transition to create more drop targets at the bottom.
function getLayoutRows<D>(transition: Transition<D>) {
  const layout = transition.layoutShift?.next ?? transition.itemsLayout;
  const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
  const itemHeight = layoutItem?.height ?? getItemHeight(transition);
  // Add extra row for resize when already at the bottom.
  if (transition.operation === "resize") {
    return Math.max(layout.rows, layoutItem ? layoutItem.y + layoutItem.height + 1 : 0);
  }
  // Add extra row(s) for reorder/insert based on item's height.
  else {
    return transition.itemsLayout.rows + itemHeight;
  }
}

function getLayoutPlaceholders<D>(transition: Transition<D>) {
  const rows = getLayoutRows(transition);
  const columns = getLayoutColumns(transition);
  return createPlaceholdersLayout(rows, columns);
}

function getInsertionDirection(cursorOffset: Coordinates): Direction {
  if (cursorOffset.x < 0) {
    return "right";
  }
  if (cursorOffset.x > 0) {
    return "left";
  }
  if (cursorOffset.y < 0) {
    return "down";
  }
  if (cursorOffset.y > 0) {
    return "up";
  }
  return "right";
}

function getLayoutShift<D>(transition: Transition<D>, path: readonly Position[], insertionDirection?: Direction) {
  if (path.length === 0) {
    return { layoutShift: null, layoutShiftWithRefloat: null };
  }

  let engine = new LayoutEngine(transition.itemsLayout);
  const width = getItemWidth(transition);
  const height = getItemHeight(transition);
  const rows = getLayoutRows(transition);
  const columns = getLayoutColumns(transition);

  switch (transition.operation) {
    case "resize":
      engine = engine.resize({ itemId: transition.draggableItem.id, path });
      break;
    case "reorder":
      engine = engine.move({ itemId: transition.draggableItem.id, path });
      break;
    case "insert":
      engine = engine.insert({
        itemId: transition.draggableItem.id,
        width,
        height,
        path: normalizeInsertionPath(path, insertionDirection ?? "right", columns, rows),
      });
      break;
  }

  return { layoutShift: engine.getLayoutShift(), layoutShiftWithRefloat: engine.refloat().getLayoutShift() };
}

function createOperationAnnouncement<D>(transition: Transition<D>, direction: null | Direction): null | Announcement {
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
