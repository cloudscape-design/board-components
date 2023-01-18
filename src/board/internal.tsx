// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import {
  BREAKPOINT_SMALL,
  COLUMNS_FULL,
  COLUMNS_SMALL,
  MIN_ROW_SPAN,
  TRANSITION_DURATION_MS,
} from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { BoardItemDefinition, BoardItemDefinitionBase, Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
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
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { createTransforms } from "./calculations/shift-layout";

import { BoardProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { OperationPerformedAnnouncement, selectTransitionRows, useTransition } from "./transition";
import { useAutoScroll } from "./use-auto-scroll";

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
  const removeTransition = transitionState.removeTransition;
  const transitionAnnouncement = transitionState.announcement;
  const acquiredItem = transition?.acquiredItem ?? null;

  // Use previous items while remove transition is in progress.
  items = removeTransition?.items ?? items;

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

  // Submit scheduled removal after a delay to let animations play.
  useEffect(() => {
    if (!removeTransition) {
      return;
    }

    const timeoutId = setTimeout(() => {
      dispatch({ type: "submit" });

      const removedItemIndex = items.findIndex((it) => it.id === removeTransition.removedItem.id);
      const nextIndexToFocus = removedItemIndex !== items.length - 1 ? removedItemIndex : items.length - 2;
      focusNextRenderIndexRef.current = nextIndexToFocus;
    }, TRANSITION_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [removeTransition, items]);

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

    focusNextRenderIdRef.current = draggableItem.id;
  });

  const removeItemAction = (removedItem: BoardItemDefinition<D>) => {
    dispatch({ type: "init-remove", items, itemsLayout, removedItem });

    onItemsChange(createCustomEvent({ items: items.filter((it) => it !== removedItem), removedItem }));
  };

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function shiftItem(direction: Direction) {
    dispatch({ type: "update-with-keyboard", direction });
    autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
  }

  function onItemNavigate(direction: Direction) {
    if (transition) {
      shiftItem(direction);
    }
  }

  const layoutShift = transition?.layoutShift ?? removeTransition?.layoutShift;
  const transforms = layoutShift ? createTransforms(itemsLayout, layoutShift.moves) : {};
  if (transition && transition.interactionType === "pointer") {
    delete transforms[transition.draggableItem.id];
  }

  const announcement = (() => {
    if (!transitionAnnouncement) {
      return "";
    }
    const item = transitionAnnouncement.item as BoardProps.Item<D>;

    const toItem = (id: ItemId) => items.find((it) => it?.id === id)!;
    const formatDirection = (direction: null | Direction) => {
      if (!direction) {
        return null;
      }
      return direction === "left" || direction === "right" ? "horizontal" : "vertical";
    };

    function getOperationState(announcement: OperationPerformedAnnouncement): BoardProps.OperationState<D> {
      const placement = announcement.placement;
      const direction = formatDirection(announcement.direction);
      const conflicts = [...announcement.conflicts].map(toItem);
      const disturbed = [...announcement.disturbed].map(toItem);

      switch (announcement.operation) {
        case "reorder":
          return { operationType: "reorder", item, placement, direction: direction!, conflicts, disturbed };
        case "insert":
          return { operationType: "insert", item, placement, conflicts, disturbed };
        case "resize":
          return {
            operationType: "resize",
            item,
            placement,
            direction: direction!,
            isMinimalColumnsReached: placement.width === (item.definition.minColumnSpan ?? 1),
            isMinimalRowsReached: placement.height === (item.definition.minRowSpan ?? MIN_ROW_SPAN),
            conflicts,
            disturbed,
          };
      }
    }

    switch (transitionAnnouncement.type) {
      case "operation-started":
        return i18nStrings.liveAnnouncementOperationStarted(transitionAnnouncement.operation);
      case "operation-performed":
        return i18nStrings.liveAnnouncementOperation(getOperationState(transitionAnnouncement));
      case "operation-committed":
        return i18nStrings.liveAnnouncementOperationCommitted(transitionAnnouncement.operation);
      case "operation-discarded":
        return i18nStrings.liveAnnouncementOperationDiscarded(transitionAnnouncement.operation);
      case "item-removed":
        return i18nStrings.liveAnnouncementOperation({
          operationType: "remove",
          item,
          disturbed: [...transitionAnnouncement.disturbed].map(toItem),
        });
    }
  })();

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
          inTransition={!!layoutShift}
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
