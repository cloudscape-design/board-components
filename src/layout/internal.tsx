// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, TRANSITION_DURATION_MS } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, Direction, GridLayoutItem, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { useSelector } from "../internal/utils/async-store";
import { Coordinates } from "../internal/utils/coordinates";
import { createCustomEvent } from "../internal/utils/events";
import {
  createItemsLayout,
  createPlaceholdersLayout,
  exportItemsLayout,
  getMinItemSize,
} from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getHoveredRect } from "./calculations/collision";
import { getNextItem } from "./calculations/grid-navigation";
import { appendMovePath, appendResizePath, createTransforms, printLayoutDebug } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { Transition, useTransition } from "./transition";
import { useAutoScroll } from "./use-auto-scroll";

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

  const autoScrollHandlers = useAutoScroll();

  const transitionStore = useTransition<D>();

  const transition = useSelector(transitionStore, (s) => s);

  const acquiredItem = useSelector(transitionStore, (state) => state?.acquiredItem ?? null);

  // The acquired item is the one being inserting at the moment but not submitted yet.
  // It needs to be included to the layout to be a part of layout shifts and rendering.
  items = acquiredItem ? [...items, acquiredItem] : items;
  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));

  // When the item gets acquired its drag handle needs to be focused to enable the keyboard handlers.
  useEffect(() => {
    if (acquiredItem) {
      itemContainerRef.current[acquiredItem.id].focusDragHandle();
    }
  }, [acquiredItem]);

  // Rows can't be 0 as it would prevent placing the first item to the layout.
  let rows = itemsLayout.rows || 1;

  // The rows can be overridden during transition to create more drop targets at the bottom.
  if (transition) {
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const itemHeight = layoutItem?.height ?? transition.draggableItemDefaultHeight;
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

  useDragSubscription("start", ({ operation, draggableItem, draggableElement, collisionIds }) => {
    const layoutItem = layoutItemById.get(draggableItem.id) ?? null;

    // Define starting path.
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = layoutItem ? appendPath([], collisionRect) : [];

    transitionStore.init({ operation, draggableItem, draggableElement, itemsLayout, path });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ operation, draggableItem, collisionIds, positionOffset }) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === draggableItem.id);
    const itemWidth = layoutItem ? layoutItem.width : transition.draggableItemDefaultWidth;
    const itemHeight = layoutItem ? layoutItem.height : transition.draggableItemDefaultHeight;
    const itemSize = itemWidth * itemHeight;

    if (operation !== "resize" && collisionIds.length < itemSize) {
      transitionStore.clearShift();
      return;
    }

    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = appendPath(transition.path, collisionRect);

    const insertionDirection = transition.insertionDirection ?? getInsertionDirection(positionOffset);
    transitionStore.updateShift({ collisionIds: new Set(collisionIds), path, insertionDirection });
  });

  useDragSubscription("submit", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    // Discard state first so that if there is an exception in the code below it doesn't prevent state update.
    transitionStore.clear();

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

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("discard", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    transitionStore.clear();

    autoScrollHandlers.removePointerEventHandlers();
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));
  };

  function focusItem(item: null | GridLayoutItem) {
    if (item) {
      itemContainerRef.current[item.id].focusDragHandle();
    } else {
      // TODO: add announcement
    }
  }

  function updateManualItemTransition(path: Position[]) {
    transitionStore.updateShift({ collisionIds: new Set(), path });
    autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
  }

  function shiftItem(transition: Transition<D>, direction: Direction) {
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

  function shiftItemLeft(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.x ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).width;
    if (lastPosition.x > (transition.operation === "resize" ? position + minSize : 0)) {
      updateManualItemTransition([...transition.path, new Position({ x: lastPosition.x - 1, y: lastPosition.y })]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemRight(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.x < (transition.operation === "resize" ? columns : columns - 1)) {
      updateManualItemTransition([...transition.path, new Position({ x: lastPosition.x + 1, y: lastPosition.y })]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemUp(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    const layout = transition.layoutShift?.next ?? itemsLayout;
    const layoutItem = layout.items.find((it) => it.id === transition.draggableItem.id);
    const position = layoutItem?.y ?? 0;
    const minSize = getMinItemSize(transition.draggableItem).height;
    if (lastPosition.y > (transition.operation === "resize" ? position + minSize : 0)) {
      updateManualItemTransition([...transition.path, new Position({ x: lastPosition.x, y: lastPosition.y - 1 })]);
    } else {
      // TODO: add announcement
    }
  }

  function shiftItemDown(transition: Transition<D>) {
    const lastPosition = transition.path[transition.path.length - 1];
    if (lastPosition.y < (transition.operation === "resize" ? 999 : rows - 1)) {
      updateManualItemTransition([...transition.path, new Position({ x: lastPosition.x, y: lastPosition.y + 1 })]);
    } else {
      // TODO: add announcement
    }
  }

  function onItemNavigate(itemId: ItemId, direction: Direction) {
    if (transition) {
      shiftItem(transition, direction);
    } else {
      focusItem(getNextItem(itemsLayout, layoutItemById.get(itemId)!, direction));
    }
  }

  const acquireItem = useCallback(
    (position: Position) => {
      transitionStore.acquire((transition) => {
        const layoutRect = containerAccessRef.current!.getBoundingClientRect();
        const itemRect = transition.draggableElement.getBoundingClientRect();
        const offset = new Coordinates({ x: itemRect.x - layoutRect.x, y: itemRect.y - layoutRect.y });
        const insertionDirection = getInsertionDirection(offset);

        // Update original insertion position if the item can't fit into the layout by width.
        const width = transition.draggableItemDefaultWidth;
        position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

        return { insertionDirection, path: [...transition.path, position] };
      });
    },
    [transitionStore, columns]
  );

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
              state={transition ? (transition.collisionIds?.has(placeholder.id) ? "hover" : "active") : "default"}
              acquire={() => acquireItem(new Position({ x: placeholder.x, y: placeholder.y }))}
            />
          ))}
          {items.map((item) => {
            const layoutItem = layoutItemById.get(item.id);
            const isResizing =
              transition && transition.operation === "resize" && transition.draggableItem.id === item.id;

            // Take item's layout size or item's definition defaults to be used for insert and reorder.
            const itemSize = layoutItem ?? {
              width: transition?.draggableItemDefaultWidth ?? 1,
              height: transition?.draggableItemDefaultHeight ?? 1,
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
                acquired={item.id === acquiredItem?.id}
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
