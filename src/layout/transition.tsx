// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from "react";
import { Operation } from "../internal/dnd-controller/controller";
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
  insertionDirection: null | Direction;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  draggableItemWidth: number;
  draggableItemHeight: number;
  acquiredItem: null | DashboardItem<D>;
  collisionIds: Set<ItemId>;
  layoutShift: null | LayoutShift;
  path: Position[];
}

type SetCallback<D> = (data: null | D) => null | D;

class LayoutTransitionActions<D> {
  private set: (callback: SetCallback<Transition<D>>) => void;

  private transitionProps: null | {
    itemsLayout: GridLayout;
    placeholdersLayout: GridLayout;
    engine: LayoutEngine;
  } = null;

  constructor(set: (callback: SetCallback<Transition<D>>) => void) {
    this.set = set;
  }

  initTransition({
    operation,
    draggableItem,
    draggableElement,
    collisionIds,
    itemsLayout,
    placeholdersLayout,
  }: {
    operation: Operation;
    draggableItem: DashboardItemBase<unknown>;
    draggableElement: HTMLElement;
    collisionIds: ItemId[];
    itemsLayout: GridLayout;
    placeholdersLayout: GridLayout;
  }) {
    this.transitionProps = { itemsLayout, placeholdersLayout, engine: new LayoutEngine(itemsLayout) };

    const layoutItem = itemsLayout.items.find((it) => it.id === draggableItem.id);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = layoutItem ? appendPath([], collisionRect) : [];

    this.set(() => ({
      operation,
      insertionDirection: null,
      draggableItem,
      draggableElement,
      draggableItemWidth: Math.min(itemsLayout.columns, getDefaultItemSize(draggableItem).width),
      draggableItemHeight: getDefaultItemSize(draggableItem).height,
      acquiredItem: null,
      collisionIds: new Set(),
      layoutShift: null,
      path,
    }));
  }

  clearTransition() {
    this.transitionProps = null;
    this.setDelayed.cancel();
    this.set(() => null);
  }

  updateWithPointer({ collisionIds, positionOffset }: { collisionIds: ItemId[]; positionOffset: Coordinates }) {
    this.setDelayed((transition) => {
      if (!transition) {
        throw new Error("Invariant violation: no transition.");
      }

      const { itemsLayout, placeholdersLayout } = this.transitionProps!;

      const layout = transition.layoutShift?.next ?? itemsLayout;
      const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
      const itemWidth = layoutItem ? layoutItem.width : transition.draggableItemWidth;
      const itemHeight = layoutItem ? layoutItem.height : transition.draggableItemHeight;
      const itemSize = itemWidth * itemHeight;

      if (transition.operation !== "resize" && collisionIds.length < itemSize) {
        return { ...transition, collisionIds: new Set(), layoutShift: null, insertionDirection: null };
      }

      const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
      const appendPath = transition.operation === "resize" ? appendResizePath : appendMovePath;
      const path = appendPath(transition.path, collisionRect);

      const insertionDirection = transition.insertionDirection ?? this.getInsertionDirection(positionOffset);
      const layoutShift = this.getLayoutShift(transition, { path, insertionDirection });

      return { ...transition, collisionIds: new Set(collisionIds), layoutShift, path, insertionDirection };
    });
  }

  updateWithKeyboard(direction: Direction) {
    const { itemsLayout } = this.transitionProps!;

    const updateManualItemTransition = (transition: Transition<D>, path: Position[]) => {
      const layoutShift = this.getLayoutShift(transition, { path, insertionDirection: null });
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

    this.set((transition) => {
      if (!transition) {
        throw new Error("Invariant violation: no transition.");
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
    });
  }

  acquireItem({ position, layoutElement }: { position: Position; layoutElement: HTMLElement }) {
    this.set((transition) => {
      const { columns } = this.transitionProps!.itemsLayout;

      if (!transition) {
        throw new Error("Invariant violation: no transition for acquire.");
      }

      const layoutRect = layoutElement.getBoundingClientRect();
      const itemRect = transition.draggableElement.getBoundingClientRect();
      const offset = new Coordinates({ x: itemRect.x - layoutRect.x, y: itemRect.y - layoutRect.y });
      const insertionDirection = this.getInsertionDirection(offset);

      // Update original insertion position if the item can't fit into the layout by width.
      const width = transition.draggableItemWidth;
      position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

      const path = [...transition.path, position];

      const layoutShift = this.getLayoutShift(transition, { path, insertionDirection });

      // TODO: resolve "any" here.
      // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
      const acquiredItem = { ...(transition.draggableItem as any), columnOffset: 0, columnSpan: 1, rowSpan: 1 };

      return { ...transition, collisionIds: new Set(), layoutShift, path, acquiredItem };
    });
  }

  private getLayoutShift(
    transition: Transition<D>,
    { path, insertionDirection }: { path: Position[]; insertionDirection: null | Direction }
  ) {
    if (path.length === 0) {
      return null;
    }

    const { itemsLayout, engine } = this.transitionProps!;

    switch (transition.operation) {
      case "resize":
        return engine.resize({ itemId: transition.draggableItem.id, path }).getLayoutShift();
      case "reorder":
        return engine.move({ itemId: transition.draggableItem.id, path }).getLayoutShift();
      case "insert":
        return engine
          .insert({
            itemId: transition.draggableItem.id,
            width: transition.draggableItemWidth,
            height: transition.draggableItemHeight,
            path: normalizeInsertionPath(path, insertionDirection ?? "right", itemsLayout.columns, itemsLayout.rows),
          })
          .getLayoutShift();
    }
  }

  private getInsertionDirection(cursorOffset: Coordinates): Direction {
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

  // The delay makes UX smoother and ensures all state is propagated between transitions.
  // W/o it the item's position between layout and item subscriptions can be out of sync for a short time.
  private setDelayed = debounce((callback: SetCallback<Transition<D>>) => {
    this.set(callback);
  }, 10);
}

export function useTransition<D>(): [null | Transition<D>, LayoutTransitionActions<D>] {
  const [transition, setTransition] = useState<null | Transition<D>>(null);
  const transitionActions = useMemo(() => new LayoutTransitionActions(setTransition), []);
  return [transition, transitionActions];
}
