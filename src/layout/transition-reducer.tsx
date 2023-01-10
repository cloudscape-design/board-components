// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useReducer } from "react";
import { InteractionType, Operation } from "../internal/dnd-controller/controller";
import { DashboardItem, DashboardItemBase, Direction, GridLayout, ItemId } from "../internal/interfaces";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import { Coordinates } from "../internal/utils/coordinates";
import { debounce } from "../internal/utils/debounce";
import { getDefaultItemSize, getMinItemSize } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { getHoveredRect } from "./calculations/collision";
import { appendMovePath, appendResizePath, normalizeInsertionPath } from "./calculations/shift-layout";

export interface Transition<D> {
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  placeholdersLayout: GridLayout;
  insertionDirection: null | Direction;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  acquiredItem: null | DashboardItem<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  path: Position[];
}

type Action = InitAction | ClearAction | UpdateWithPointerAction | UpdateWithKeyboardAction | AcquireItemAction;

interface InitAction {
  type: "init";
  operation: Operation;
  interactionType: InteractionType;
  itemsLayout: GridLayout;
  placeholdersLayout: GridLayout;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  collisionIds: readonly ItemId[];
}
interface ClearAction {
  type: "clear";
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

export function useTransition() {
  const [state, dispatch] = useReducer(transitionReducer, null);

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

  return [state, decoratedDispatch];
}

function transitionReducer<D>(state: null | Transition<D>, action: Action): null | Transition<D> {
  switch (action.type) {
    case "init":
      return initTransition(action);
    case "clear":
      return null;
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
  placeholdersLayout,
  draggableItem,
  draggableElement,
  collisionIds,
}: InitAction): Transition<D> {
  const layoutItem = itemsLayout.items.find((it) => it.id === draggableItem.id);
  const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
  const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
  const path = layoutItem ? appendPath([], collisionRect) : [];
  return {
    operation,
    interactionType,
    itemsLayout,
    placeholdersLayout,
    insertionDirection: null,
    draggableItem,
    draggableElement,
    acquiredItem: null,
    collisionIds: new Set(),
    layoutShift: null,
    path,
  };
}

function updateTransitionWithPointerEvent<D>(
  transition: null | Transition<D>,
  { collisionIds, positionOffset }: UpdateWithPointerAction
): Transition<D> {
  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const layout = transition.layoutShift?.next ?? transition.itemsLayout;
  const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
  const itemWidth = layoutItem ? layoutItem.width : getItemSize(transition).width;
  const itemHeight = layoutItem ? layoutItem.height : getItemSize(transition).height;
  const itemSize = itemWidth * itemHeight;

  if (transition.operation !== "resize" && collisionIds.length < itemSize) {
    return { ...transition, collisionIds: new Set(), layoutShift: null, insertionDirection: null };
  }

  const collisionRect = getHoveredRect(collisionIds, transition.placeholdersLayout.items);
  const appendPath = transition.operation === "resize" ? appendResizePath : appendMovePath;
  const path = appendPath(transition.path, collisionRect);

  const insertionDirection = transition.insertionDirection ?? getInsertionDirection(positionOffset);
  const layoutShift = getLayoutShift(transition, path, insertionDirection);

  return { ...transition, collisionIds: new Set(collisionIds), layoutShift, path, insertionDirection };
}

function updateTransitionWithKeyboardEvent<D>(
  transition: null | Transition<D>,
  { direction }: UpdateWithKeyboardAction
): Transition<D> {
  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const { itemsLayout } = transition;

  const updateManualItemTransition = (transition: Transition<D>, path: Position[]) => {
    const layoutShift = getLayoutShift(transition, path);
    return { ...transition, layoutShift, path };
  };

  function shiftItemLeft(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.x ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).width;
    if (lastPosition.x > (transition.operation === "resize" ? position + minSize : 0)) {
      return updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x - 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
      return transition;
    }
  }

  function shiftItemRight(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x < (transition.operation === "resize" ? itemsLayout.columns : itemsLayout.columns - 1)) {
      return updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x + 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
      return transition;
    }
  }

  function shiftItemUp(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.y ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).height;
    if (lastPosition.y > (transition.operation === "resize" ? position + minSize : 0)) {
      return updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x, y: lastPosition.y - 1 }),
      ]);
    } else {
      // TODO: add announcement
      return transition;
    }
  }

  function shiftItemDown(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y < (transition.operation === "resize" ? 999 : itemsLayout.rows - 1)) {
      return updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x, y: lastPosition.y + 1 }),
      ]);
    } else {
      // TODO: add announcement
      return transition;
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
  transition: null | Transition<D>,
  { position, layoutElement }: AcquireItemAction
): Transition<D> {
  if (!transition) {
    throw new Error("Invariant violation: no transition.");
  }

  const { columns } = transition.itemsLayout;

  const layoutRect = layoutElement.getBoundingClientRect();
  const itemRect = transition.draggableElement.getBoundingClientRect();
  const offset = new Coordinates({ x: itemRect.x - layoutRect.x, y: itemRect.y - layoutRect.y });
  const insertionDirection = getInsertionDirection(offset);

  // Update original insertion position if the item can't fit into the layout by width.
  const width = getItemSize(transition).width;
  position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

  const path = [...transition.path, position];

  const layoutShift = getLayoutShift(transition, path, insertionDirection);

  // TODO: resolve "any" here.
  // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
  const acquiredItem = { ...(transition.draggableItem as any), columnOffset: 0, columnSpan: 1, rowSpan: 1 };

  return { ...transition, collisionIds: new Set(), layoutShift, path, acquiredItem };
}

function getItemSize<D>(transition: Transition<D>) {
  return {
    width: Math.min(transition.itemsLayout.columns, getDefaultItemSize(transition.draggableItem).width),
    height: getDefaultItemSize(transition.draggableItem).height,
  };
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
    return null;
  }

  const engine = new LayoutEngine(transition.itemsLayout);
  const { columns, rows } = transition.itemsLayout;
  const { width, height } = getItemSize(transition);

  switch (transition.operation) {
    case "resize":
      return engine.resize({ itemId: transition.draggableItem.id, path }).getLayoutShift();
    case "reorder":
      return engine.move({ itemId: transition.draggableItem.id, path }).getLayoutShift();
    case "insert":
      return engine
        .insert({
          itemId: transition.draggableItem.id,
          width,
          height,
          path: normalizeInsertionPath(path, insertionDirection ?? "right", columns, rows),
        })
        .getLayoutShift();
  }
}
