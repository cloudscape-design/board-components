// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, TRANSITION_DURATION_MS } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { BoardItemDefinition, BoardItemDefinitionBase, Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import LiveRegion from "../internal/live-region";
import { ScreenReaderGridNavigation } from "../internal/screenreader-grid-navigation";
import { createCustomEvent } from "../internal/utils/events";
import {
  createItemsLayout,
  createPlaceholdersLayout,
  exportItemsLayout,
  getDefaultItemSize,
} from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useAutoScroll } from "../internal/utils/use-auto-scroll";
import { useMergeRefs } from "../internal/utils/use-merge-refs";

import { BoardProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { selectTransitionRows, useTransition } from "./transition";
import { announcementToString } from "./utils/announcements";
import { createTransforms } from "./utils/create-transforms";

export function InternalBoard<D>({ items, renderItem, onItemsChange, empty, i18nStrings }: BoardProps<D>) {
  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

  const autoScrollHandlers = useAutoScroll();

  const [transitionState, dispatch] = useTransition<D>();
  const transition = transitionState.transition;
  const transitionAnnouncement = transitionState.announcement;
  const acquiredItem = transition && transitionState.acquiredItem;

  // The acquired item is the one being inserting at the moment but not submitted yet.
  // It needs to be included to the layout to be a part of layout shifts and rendering.
  items = acquiredItem ? [...items, acquiredItem] : items;
  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));
  const layoutItemIndexById = new Map(itemsLayout.items.map((item, index) => [item.id, index]));

  // Items and layout items must maintain the same order visually, in the DOM and in the data
  // to ensure on-change events and tab order work as expected.
  items = [...items].sort((a, b) => (layoutItemIndexById.get(a.id) ?? -1) - (layoutItemIndexById.get(b.id) ?? -1));

  // When an item gets acquired or removed the focus needs to be dispatched on the next render.
  const focusNextRenderIndexRef = useRef<null | number>(null);
  const focusNextRenderIdRef = useRef<null | ItemId>(null);
  useEffect(() => {
    const focusTarget = focusNextRenderIdRef.current ?? items[focusNextRenderIndexRef.current ?? -1]?.id;
    if (focusTarget) {
      itemContainerRef.current[focusTarget].focusDragHandle();
    }
    focusNextRenderIndexRef.current = null;
    focusNextRenderIdRef.current = null;
  });

  const getDefaultItemWidth = (item: BoardItemDefinitionBase<unknown>) =>
    Math.min(columns, getDefaultItemSize(item).width);
  const getDefaultItemHeight = (item: BoardItemDefinitionBase<unknown>) => getDefaultItemSize(item).height;

  // Rows can't be 0 as it would prevent placing the first item to the layout.
  const rows = selectTransitionRows(transitionState) || itemsLayout.rows || 1;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  useDragSubscription("start", ({ operation, interactionType, draggableItem, draggableElement, collisionIds }) => {
    dispatch({
      type: "init",
      operation,
      interactionType,
      itemsLayout,
      // TODO: resolve any
      // The code only works assuming the board can take any draggable.
      // If draggables can be of different types a check of some sort is required here.
      draggableItem: draggableItem as any,
      draggableElement,
      collisionIds,
    });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ collisionIds, positionOffset }) => {
    dispatch({ type: "update-with-pointer", collisionIds, positionOffset });
  });

  useDragSubscription("submit", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    dispatch({ type: "submit" });

    if (transition.layoutShift) {
      if (transition.layoutShift.conflicts.length === 0) {
        // Commit new layout for insert case.
        if (transition.operation === "insert") {
          const newLayout = exportItemsLayout(transition.layoutShift.next, [...items, transition.draggableItem]);
          const addedItem = newLayout.find((item) => item.id === transition.draggableItem.id)!;
          onItemsChange(createCustomEvent({ items: newLayout, addedItem }));
        }
        // Commit new layout for reorder/resize case.
        else {
          onItemsChange(createCustomEvent({ items: exportItemsLayout(transition.layoutShift.next, items) }));
        }
      }
    }

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("discard", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    dispatch({ type: "discard" });

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("acquire", ({ droppableId, draggableItem }) => {
    const placeholder = placeholdersLayout.items.find((it) => it.id === droppableId);

    // Check if placeholder belongs to the board.
    if (!placeholder) {
      return;
    }

    dispatch({
      type: "acquire-item",
      position: new Position({ x: placeholder.x, y: placeholder.y }),
      layoutElement: containerAccessRef.current!,
    });

    focusNextRenderIdRef.current = draggableItem.id ?? null;
  });

  const removeItemAction = (removedItem: BoardItemDefinition<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();

    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));

    dispatch({ type: "remove-item", itemsLayout, itemId: removedItem.id });

    const removedItemIndex = items.findIndex((it) => it === removedItem);
    const nextIndexToFocus = removedItemIndex !== items.length - 1 ? removedItemIndex : items.length - 2;
    focusNextRenderIndexRef.current = nextIndexToFocus;
  };

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function onItemNavigate(direction: Direction) {
    if (transition) {
      dispatch({ type: "update-with-keyboard", direction });
      autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
    }
  }

  const transforms = transition?.layoutShift ? createTransforms(itemsLayout, transition.layoutShift.moves) : {};
  if (transition && transition.interactionType === "pointer") {
    delete transforms[transition.draggableItem.id];
  }

  const announcement = transitionAnnouncement
    ? announcementToString(transitionAnnouncement, items, transitionState.acquiredItem, i18nStrings)
    : "";

  const showGrid = items.length > 0 || transition;

  return (
    <div ref={containerRef} className={clsx(styles.root, { [styles.empty]: !showGrid })}>
      <ScreenReaderGridNavigation
        items={items}
        itemsLayout={itemsLayout}
        ariaLabel={i18nStrings.navigationAriaLabel}
        ariaDescription={i18nStrings.navigationAriaDescription}
        itemAriaLabel={i18nStrings.navigationItemAriaLabel}
        onActivateItem={focusItem}
      />

      {showGrid ? (
        <Grid
          columns={columns}
          rows={rows}
          layout={[...placeholdersLayout.items, ...itemsLayout.items]}
          transforms={transforms}
        >
          {placeholdersLayout.items.map((placeholder) => (
            <Placeholder
              key={placeholder.id}
              id={placeholder.id}
              state={transition ? (transition.collisionIds?.has(placeholder.id) ? "hover" : "active") : "default"}
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
                acquired={item.id === acquiredItem?.id}
                itemSize={itemSize}
                itemMaxSize={itemMaxSize}
                onNavigate={onItemNavigate}
              >
                {renderItem(item, { removeItem: () => removeItemAction(item) })}
              </ItemContainer>
            );
          })}
        </Grid>
      ) : (
        empty
      )}

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
