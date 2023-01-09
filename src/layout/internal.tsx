// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, TRANSITION_DURATION_MS } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, Direction, GridLayoutItem, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { useSelector } from "../internal/utils/async-store";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getNextItem } from "./calculations/grid-navigation";
import { createTransforms } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { useTransition } from "./transition";
import { useAutoScroll } from "./use-auto-scroll";

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
    const itemHeight = layoutItem?.height ?? transition.draggableItemHeight;
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
    transitionStore.initTransition({
      operation,
      draggableItem,
      draggableElement,
      collisionIds,
      itemsLayout,
      placeholdersLayout,
    });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ collisionIds, positionOffset }) => {
    transitionStore.updateWithPointer({ collisionIds, positionOffset });
  });

  useDragSubscription("submit", () => {
    // Discard state immediately to ensure cleanup if the code below throws an error.
    const transition = transitionStore.clearTransition();

    if (transition.layoutShift) {
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
    transitionStore.clearTransition();

    autoScrollHandlers.removePointerEventHandlers();
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));
  };

  const focusItem = (item: null | GridLayoutItem) => {
    if (item) {
      itemContainerRef.current[item.id].focusDragHandle();
    } else {
      // TODO: add announcement
    }
  };

  function shiftItem(direction: Direction) {
    transitionStore.updateWithKeyboard(direction);
    autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
  }

  function onItemNavigate(itemId: ItemId, direction: Direction) {
    if (transitionStore.hasTransition()) {
      shiftItem(direction);
    } else {
      focusItem(getNextItem(itemsLayout, layoutItemById.get(itemId)!, direction));
    }
  }

  const acquireItem = (position: Position) => {
    transitionStore.acquireItem({ position, layoutElement: containerAccessRef.current! });
  };

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
              width: transition?.draggableItemWidth ?? 1,
              height: transition?.draggableItemHeight ?? 1,
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
