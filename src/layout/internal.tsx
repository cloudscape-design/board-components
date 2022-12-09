// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, DashboardItemBase, Direction, GridLayoutItem, ItemId, Transform } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { debounce } from "../internal/utils/debounce";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getHoveredRect } from "./calculations/collision";
import { appendMovePath, appendResizePath, createTransforms, printLayoutDebug } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";

interface Transition {
  isResizing: boolean;
  engine: LayoutEngine;
  transforms: { [itemId: ItemId]: Transform };
  collisionIds: ItemId[];
  draggableItem: DashboardItemBase<unknown>;
  layoutItem: null | GridLayoutItem;
  path: Position[];
  rows: number;
}

function getLayoutShift(transition: Transition, path: Position[]) {
  if (path.length === 0) {
    return null;
  }

  if (transition.isResizing) {
    return transition.engine.resize({ itemId: transition.draggableItem.id, path }).getLayoutShift();
  }

  if (transition.layoutItem) {
    return transition.engine.move({ itemId: transition.draggableItem.id, path }).getLayoutShift();
  }

  return transition.engine
    .insert({
      itemId: transition.draggableItem.id,
      width: transition.draggableItem.definition.defaultColumnSpan,
      height: transition.draggableItem.definition.defaultRowSpan,
      path,
    })
    .getLayoutShift();
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
  // Rows can't be 0 as it would prevent placing the first item to the layout.
  const rows = (transition?.rows ?? itemsLayout.rows) || 1;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  // The debounce makes UX smoother and ensures all state is propagated between transitions.
  // W/o it the item's position between layout and item subscriptions can be out of sync for a short time.
  const setTransitionDelayed = useMemo(
    () => debounce((nextTransition: Transition) => setTransition(nextTransition), 10),
    []
  );

  useDragSubscription("start", (detail) => {
    const layoutItem = layoutItemById.get(detail.draggableItem.id) ?? null;

    // Define starting path.
    const collisionRect = getHoveredRect(detail.collisionIds, placeholdersLayout.items);
    const appendPath = detail.operation === "resize" ? appendResizePath : appendMovePath;
    const path = layoutItem ? appendPath([], collisionRect) : [];

    // Override rows to plan for possible height increase.
    const itemHeight = layoutItem ? layoutItem.height : detail.draggableItem.definition.defaultRowSpan;
    const rows = detail.operation === "resize" ? itemsLayout.rows : itemsLayout.rows + itemHeight;

    setTransition({
      isResizing: detail.operation === "resize",
      engine: new LayoutEngine(itemsLayout),
      transforms: {},
      collisionIds: [],
      draggableItem: detail.draggableItem,
      layoutItem,
      path,
      rows,
    });
  });

  useDragSubscription("update", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const itemWidth = transition.layoutItem
      ? transition.layoutItem.width
      : transition.draggableItem.definition.defaultColumnSpan;
    const itemHeight = transition.layoutItem
      ? transition.layoutItem.height
      : transition.draggableItem.definition.defaultRowSpan;
    const itemSize = itemWidth * itemHeight;

    if (detail.operation !== "resize" && detail.collisionIds.length < itemSize) {
      setTransitionDelayed({ ...transition, collisionIds: [], transforms: {}, rows: itemsLayout.rows });
      return;
    }

    const collisionRect = getHoveredRect(detail.collisionIds, placeholdersLayout.items);
    const appendPath = detail.operation === "resize" ? appendResizePath : appendMovePath;
    const path = appendPath(transition.path, collisionRect);

    const layoutShift = getLayoutShift(transition, path);

    if (layoutShift) {
      const transforms = createTransforms(itemsLayout, layoutShift.moves);

      const rows =
        detail.operation === "resize"
          ? layoutShift.next.rows + itemHeight
          : Math.min(itemsLayout.rows + itemHeight, layoutShift.next.rows + itemHeight);

      setTransitionDelayed({ ...transition, collisionIds: detail.collisionIds, transforms, path, rows });
    }
  });

  useDragSubscription("submit", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    // Discard state first so that if there is an exption in the code below it doesn't prevent state update.
    setTransitionDelayed.cancel();
    setTransition(null);

    const itemWidth = transition.layoutItem
      ? transition.layoutItem.width
      : transition.draggableItem.definition.defaultColumnSpan;
    const itemHeight = transition.layoutItem
      ? transition.layoutItem.height
      : transition.draggableItem.definition.defaultRowSpan;
    const itemSize = itemWidth * itemHeight;

    if (detail.operation !== "resize" && detail.collisionIds.length < itemSize) {
      return;
    }

    const layoutShift = getLayoutShift(transition, transition.path);

    if (layoutShift && detail.collisionIds.length > 0) {
      printLayoutDebug(itemsLayout, layoutShift);

      // Commit new layout for insert case.
      if (!transition.layoutItem) {
        // TODO: resolve "any" here.
        // It is not quite clear yet how to ensure the addedItem matches generic D type.
        const newLayout = exportItemsLayout(layoutShift.next, [...items, transition.draggableItem] as any);
        const addedItem = newLayout.find((item) => item.id === transition.draggableItem.id)!;
        onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
      }
      // Commit new layout for reorder/resize case.
      else {
        onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items) }));
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

  function updateManualItemTransition(transition: Transition, targetItem: GridLayoutItem, path: Position[]) {
    const layoutShift = getLayoutShift(transition, path);
    if (layoutShift) {
      const rows = Math.min(itemsLayout.rows + targetItem.height, layoutShift.next.rows + targetItem.height);
      const transforms = createTransforms(itemsLayout, layoutShift.moves);
      setTransition({ ...transition, collisionIds: [], transforms, path, rows });
    }
  }

  function shiftItemLeft(transition: Transition, targetItem: GridLayoutItem) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x > (transition.isResizing ? 1 : 0)) {
      updateManualItemTransition(transition, targetItem, [
        ...transition.path,
        new Position({ x: lastPosition.x - 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemRight(transition: Transition, targetItem: GridLayoutItem) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x < (transition.isResizing ? columns : columns - 1)) {
      updateManualItemTransition(transition, targetItem, [
        ...transition.path,
        new Position({ x: lastPosition.x + 1, y: lastPosition.y }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemUp(transition: Transition, targetItem: GridLayoutItem) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y > (transition.isResizing ? 1 : 0)) {
      updateManualItemTransition(transition, targetItem, [
        ...transition.path,
        new Position({ x: lastPosition.x, y: lastPosition.y - 1 }),
      ]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemDown(transition: Transition, targetItem: GridLayoutItem) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y < (transition.isResizing ? 999 : rows - 1)) {
      updateManualItemTransition(transition, targetItem, [
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
        return transition ? shiftItemLeft(transition, layoutItem) : navigateItemLeft(layoutItem);
      case "right":
        return transition ? shiftItemRight(transition, layoutItem) : navigateItemRight(layoutItem);
      case "up":
        return transition ? shiftItemUp(transition, layoutItem) : navigateItemUp(layoutItem);
      case "down":
        return transition ? shiftItemDown(transition, layoutItem) : navigateItemDown(layoutItem);
    }
  }

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
            const isResizing = transition && transition.isResizing && transition.draggableItem.id === item.id;

            // Take item's layout size or item's definition defaults to be used for insert and reorder.
            const itemSize = layoutItem ?? {
              width: item.definition.defaultColumnSpan,
              height: item.definition.defaultRowSpan,
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
                transform={transition?.transforms[item.id] ?? null}
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
