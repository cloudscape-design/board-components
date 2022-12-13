// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { Operation, useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, DashboardItemBase, Direction, GridLayoutItem, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import { Coordinates } from "../internal/utils/coordinates";
import { debounce } from "../internal/utils/debounce";
import { createCustomEvent } from "../internal/utils/events";
import {
  createItemsLayout,
  createPlaceholdersLayout,
  exportItemsLayout,
  getDefaultItemSize,
  getMinItemSize,
} from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getHoveredRect } from "./calculations/collision";
import {
  appendMovePath,
  appendResizePath,
  createTransforms,
  normalizeInsertionPath,
  printLayoutDebug,
} from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";

interface Transition {
  operation: Operation;
  insertionDirection: null | Direction;
  draggableItem: DashboardItemBase<unknown>;
  collisionIds: ItemId[];
  engine: LayoutEngine;
  layoutShift: null | LayoutShift;
  path: Position[];
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

export default function DashboardLayout<D>({ items, renderItem, onItemsChange, empty }: DashboardLayoutProps<D>) {
  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

  const [transition, setTransition] = useState<null | Transition>(null);

  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));

  const getDefaultItemWidth = (item: DashboardItemBase<unknown>) => Math.min(columns, getDefaultItemSize(item).width);
  const getDefaultItemHeight = (item: DashboardItemBase<unknown>) => getDefaultItemSize(item).height;

  // Rows can't be 0 as it would prevent placing the first item to the layout.
  let rows = itemsLayout.rows || 1;

  if (transition) {
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const itemHeight = layoutItem?.height ?? getDefaultItemHeight(transition.draggableItem);
    // Add extra row for resize when already at the bottom.
    if (transition.operation === "resize") {
      rows = Math.max(layout.rows, layoutItem ? layoutItem.y + layoutItem.height + 1 : 0);
    }
    // Add extra row(s) for reorder/insert based on item's height.
    else {
      rows = itemsLayout.rows + itemHeight;
    }
  }

  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function getLayoutShift(transition: Transition, path: Position[], insertionDirection: Direction = "right") {
    if (path.length === 0) {
      return null;
    }

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
            path: normalizeInsertionPath(path, insertionDirection, columns, rows),
          })
          .getLayoutShift();
    }
  }

  // The debounce makes UX smoother and ensures all state is propagated between transitions.
  // W/o it the item's position between layout and item subscriptions can be out of sync for a short time.
  const setTransitionDelayed = useMemo(
    () => debounce((nextTransition: Transition) => setTransition(nextTransition), 10),
    []
  );

  useDragSubscription("start", ({ operation, draggableItem, collisionIds }) => {
    const layoutItem = layoutItemById.get(draggableItem.id) ?? null;

    // Define starting path.
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = layoutItem ? appendPath([], collisionRect) : [];

    setTransition({
      operation,
      insertionDirection: null,
      draggableItem,
      collisionIds: [],
      engine: new LayoutEngine(itemsLayout),
      layoutShift: null,
      path,
    });
  });

  useDragSubscription("update", ({ operation, draggableItem, collisionIds, cursorOffset }) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === draggableItem.id);
    const itemWidth = layoutItem ? layoutItem.width : getDefaultItemWidth(transition.draggableItem);
    const itemHeight = layoutItem ? layoutItem.height : getDefaultItemHeight(transition.draggableItem);
    const itemSize = itemWidth * itemHeight;

    if (operation !== "resize" && collisionIds.length < itemSize) {
      setTransitionDelayed({ ...transition, collisionIds: [], layoutShift: null, insertionDirection: null });
      return;
    }

    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = appendPath(transition.path, collisionRect);

    const insertionDirection = transition.insertionDirection ?? getInsertionDirection(cursorOffset);
    const layoutShift = getLayoutShift(transition, path, insertionDirection);

    if (layoutShift) {
      setTransitionDelayed({ ...transition, collisionIds, layoutShift, path, insertionDirection });
    }
  });

  useDragSubscription("submit", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    // Discard state first so that if there is an exption in the code below it doesn't prevent state update.
    setTransitionDelayed.cancel();
    setTransition(null);

    if (transition.layoutShift) {
      printLayoutDebug(itemsLayout, transition.layoutShift);

      // Commit new layout for insert case.
      if (transition.operation === "insert") {
        // TODO: resolve "any" here.
        // It is not quite clear yet how to ensure the addedItem matches generic D type.
        const newLayout = exportItemsLayout(transition.layoutShift.next, [...items, transition.draggableItem] as any);
        const addedItem = newLayout.find((item) => item.id === transition.draggableItem.id)!;
        onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
      }
      // Commit new layout for reorder/resize case.
      else {
        onItemsChange(createCustomEvent({ items: exportItemsLayout(transition.layoutShift.next, items) }));
      }
    }
  });

  useDragSubscription("discard", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }
    setTransitionDelayed.cancel();
    setTransition(null);
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));
  };

  function focusItem(item?: GridLayoutItem) {
    if (item) {
      itemContainerRef.current[item.id].focusDragHandle();
    } else {
      // TODO: add announcement
    }
  }

  function updateManualItemTransition(transition: Transition, path: Position[]) {
    const layoutShift = getLayoutShift(transition, path);
    if (layoutShift) {
      setTransition({ ...transition, collisionIds: [], layoutShift, path });
    }
  }

  function shiftItemLeft(transition: Transition) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.x ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).width;
    if (lastPosition.x > (transition.operation === "resize" ? position + minSize : 0)) {
      updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x - 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemRight(transition: Transition) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x < (transition.operation === "resize" ? columns : columns - 1)) {
      updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x + 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemUp(transition: Transition) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.y ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).height;
    if (lastPosition.y > (transition.operation === "resize" ? position + minSize : 0)) {
      updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x, y: lastPosition.y - 1 }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemDown(transition: Transition) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y < (transition.operation === "resize" ? 999 : rows - 1)) {
      updateManualItemTransition(transition, [
        ...transition.path,
        new Position({ x: lastPosition.x, y: lastPosition.y + 1 }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function navigateItemLeft(targetItem: GridLayoutItem) {
    const [matched] = itemsLayout.items
      .filter((item) => item.y === targetItem.y && item.x < targetItem.x)
      .sort((a, b) => b.x - a.x);
    focusItem(matched);
  }

  function navigateItemRight(targetItem: GridLayoutItem) {
    const [matched] = itemsLayout.items
      .filter((item) => item.y === targetItem.y && item.x > targetItem.x)
      .sort((a, b) => a.x - b.x);
    focusItem(matched);
  }

  function navigateItemUp(targetItem: GridLayoutItem) {
    const [matched] = itemsLayout.items
      .filter((item) => item.x === targetItem.x && item.y < targetItem.y)
      .sort((a, b) => b.y - a.y);
    focusItem(matched);
  }

  function navigateItemDown(targetItem: GridLayoutItem) {
    const [matched] = itemsLayout.items
      .filter((item) => item.x === targetItem.x && item.y > targetItem.y)
      .sort((a, b) => a.y - b.y);
    focusItem(matched);
  }

  function onItemNavigate(itemId: ItemId, direction: Direction) {
    const layoutItem = layoutItemById.get(itemId)!;
    switch (direction) {
      case "left":
        return transition ? shiftItemLeft(transition) : navigateItemLeft(layoutItem);
      case "right":
        return transition ? shiftItemRight(transition) : navigateItemRight(layoutItem);
      case "up":
        return transition ? shiftItemUp(transition) : navigateItemUp(layoutItem);
      case "down":
        return transition ? shiftItemDown(transition) : navigateItemDown(layoutItem);
    }
  }

  const transforms = transition?.layoutShift ? createTransforms(itemsLayout, transition.layoutShift.moves) : {};

  const showGrid = items.length > 0 || transition;

  // TODO: make sure empty / finished states announcements are considered.

  return (
    <div ref={containerRef} className={clsx(styles.root, { [styles.empty]: !showGrid })}>
      {showGrid ? (
        <Grid columns={columns} rows={rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
          {placeholdersLayout.items.map((placeholder) => (
            <Placeholder
              key={placeholder.id}
              id={placeholder.id}
              state={transition ? (transition.collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"}
            />
          ))}
          {items.map((item) => {
            const layoutItem = layoutItemById.get(item.id);
            const isResizing =
              transition && transition.operation === "resize" && transition.draggableItem.id === item.id;

            // Take item's layout size or item's definition defaults to be used for insert and reorder.
            const itemSize = layoutItem ?? {
              width: getDefaultItemWidth(item),
              height: getDefaultItemHeight(item),
            };

            const itemMaxSize = isResizing && layoutItem ? { width: columns - layoutItem.x, height: 999 } : itemSize;

            return (
              <ItemContainer
                ref={(elem) => {
                  if (elem) {
                    itemContainerRef.current[item.id] = elem;
                  } else {
                    delete itemContainerRef.current[item.id];
                  }
                }}
                key={item.id}
                item={item}
                itemSize={itemSize}
                itemMaxSize={itemMaxSize}
                transform={transforms[item.id] ?? null}
                onNavigate={(direction) => onItemNavigate(item.id, direction)}
              >
                {renderItem(item, { removeItem: () => removeItemAction(item) })}
              </ItemContainer>
            );
          })}
        </Grid>
      ) : (
        empty
      )}
    </div>
  );
}
