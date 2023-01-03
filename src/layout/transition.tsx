// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from "react";
import { Operation } from "../internal/dnd-controller/controller";
import { DashboardItem, DashboardItemBase, Direction, GridLayout, ItemId } from "../internal/interfaces";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import AsyncStore from "../internal/utils/async-store";
import { debounce } from "../internal/utils/debounce";
import { getDefaultItemSize } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { normalizeInsertionPath } from "./calculations/shift-layout";

export interface Transition<D> {
  operation: Operation;
  insertionDirection: null | Direction;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
  acquiredItem: null | DashboardItem<D>;
  collisionIds: Set<ItemId>;
  engine: LayoutEngine;
  layoutShift: null | LayoutShift;
  path: Position[];
}

class LayoutTransitionStore<D> extends AsyncStore<null | Transition<D>> {
  clear() {
    this.setDelayed.cancel();
    this.set(() => null);
  }

  init({
    operation,
    draggableItem,
    draggableElement,
    itemsLayout,
    path,
  }: {
    operation: Operation;
    draggableItem: DashboardItemBase<unknown>;
    draggableElement: HTMLElement;
    itemsLayout: GridLayout;
    path: Position[];
  }) {
    this.set(() => ({
      operation,
      insertionDirection: null,
      draggableItem,
      draggableElement,
      acquiredItem: null,
      collisionIds: new Set(),
      engine: new LayoutEngine(itemsLayout),
      layoutShift: null,
      path,
    }));
  }

  acquire({ path, insertionDirection }: { path: Position[]; insertionDirection: Direction }) {
    this.set((transition) => {
      if (!transition) {
        return null;
      }

      const layoutShift = this.getLayoutShift({ path, insertionDirection });

      // TODO: resolve "any" here.
      // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
      const acquiredItem = { ...(transition.draggableItem as any), columnOffset: 0, columnSpan: 1, rowSpan: 1 };

      return { ...transition, collisionIds: new Set(), layoutShift, path, acquiredItem };
    });
  }

  clearShift() {
    this.setDelayed(
      (transition) =>
        transition && { ...transition, collisionIds: new Set(), layoutShift: null, insertionDirection: null }
    );
  }

  updateShift({
    collisionIds,
    path,
    insertionDirection: direction,
  }: {
    collisionIds: Set<ItemId>;
    path: Position[];
    insertionDirection?: Direction;
  }) {
    this.setDelayed((transition) => {
      if (!transition) {
        return null;
      }

      const insertionDirection = direction ?? transition.insertionDirection;
      const layoutShift = this.getLayoutShift({ path, insertionDirection });

      return { ...transition, collisionIds, layoutShift, path, insertionDirection };
    });
  }

  private getLayoutShift({ path, insertionDirection }: { path: Position[]; insertionDirection: null | Direction }) {
    const transition = this.get();

    if (!transition || path.length === 0) {
      return null;
    }

    const currentLayoutShift = transition.engine.getLayoutShift().current;
    const { columns, rows } = currentLayoutShift;

    const getDefaultItemWidth = (item: DashboardItemBase<unknown>) => Math.min(columns, getDefaultItemSize(item).width);
    const getDefaultItemHeight = (item: DashboardItemBase<unknown>) => getDefaultItemSize(item).height;

    switch (transition.operation) {
      case "resize":
        return transition.engine.resize({ itemId: transition.draggableItem.id, path }).getLayoutShift();
      case "reorder":
        return transition.engine.move({ itemId: transition.draggableItem.id, path }).getLayoutShift();
      case "insert":
        return transition.engine
          .insert({
            itemId: transition.draggableItem.id,
            width: getDefaultItemWidth(transition.draggableItem),
            height: getDefaultItemHeight(transition.draggableItem),
            path: normalizeInsertionPath(path, insertionDirection ?? "right", columns, rows),
          })
          .getLayoutShift();
    }
  }

  // The delay makes UX smoother and ensures all state is propagated between transitions.
  // W/o it the item's position between layout and item subscriptions can be out of sync for a short time.
  private setDelayed = debounce((callback: (transition: null | Transition<D>) => null | Transition<D>) => {
    this.set(callback);
  }, 10);
}

export function useTransition<D>() {
  return useMemo(() => new LayoutTransitionStore<D>(null), []);
}
