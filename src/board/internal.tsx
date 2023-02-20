// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import {
  BREAKPOINT_M,
  BREAKPOINT_XL,
  BREAKPOINT_XS,
  COLUMNS_DEFAULT,
  COLUMNS_M,
  COLUMNS_XL,
  COLUMNS_XS,
  TRANSITION_DURATION_MS,
} from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { BoardItemDefinition, BoardItemDefinitionBase, Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import { ScreenReaderGridNavigation } from "../internal/screenreader-grid-navigation";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useAutoScroll } from "../internal/utils/use-auto-scroll";
import { useMergeRefs } from "../internal/utils/use-merge-refs";

import { BoardProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { selectTransitionRows, useTransition } from "./transition";
import { announcementToString } from "./utils/announcements";
import { createTransforms } from "./utils/create-transforms";
import { getInsertingItemHeight, getInsertingItemWidth } from "./utils/layout";

const boardSizes = { xs: COLUMNS_XS, m: COLUMNS_M, xl: COLUMNS_XL, default: COLUMNS_DEFAULT };

export function InternalBoard<D>({
  items: allItems,
  renderItem,
  onItemsChange,
  empty,
  i18nStrings,
  __internalRootRef,
}: BoardProps<D> & InternalBaseComponentProps) {
  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [containerSize, containerQueryRef] = useContainerQuery((entry) => {
    if (entry.contentBoxWidth < BREAKPOINT_XS) {
      return "xs";
    }
    if (entry.contentBoxWidth < BREAKPOINT_M) {
      return "m";
    }
    if (entry.contentBoxWidth < BREAKPOINT_XL) {
      return "xl";
    }
    return "default";
  }, []);
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const columns = boardSizes[containerSize ?? "default"];
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

  const autoScrollHandlers = useAutoScroll();

  const [transitionState, dispatch] = useTransition<D>();
  const transition = transitionState.transition;
  const removeTransition = transitionState.removeTransition;
  const transitionAnnouncement = transitionState.announcement;
  const acquiredItem = transition?.acquiredItem ?? null;

  let items = allItems[containerSize ?? "default"];

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

  const rows = selectTransitionRows(transitionState) || itemsLayout.rows;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function isElementOverBoard(draggableElement: HTMLElement) {
    const board = containerAccessRef.current!;
    const boardContains = (target: null | Element) => board === target || board.contains(target);

    const rect = draggableElement.getBoundingClientRect();
    return (
      boardContains(document.elementFromPoint(rect.left, rect.top)) ||
      boardContains(document.elementFromPoint(rect.right, rect.top)) ||
      boardContains(document.elementFromPoint(rect.right, rect.bottom)) ||
      boardContains(document.elementFromPoint(rect.left, rect.bottom))
    );
  }

  useDragSubscription("start", ({ operation, interactionType, draggableItem, draggableElement, collisionIds }) => {
    dispatch({
      type: "init",
      operation,
      interactionType,
      itemsLayout,
      // TODO: resolve any
      // The code only works assuming the board can take any draggable.
      // If draggables can be of different types a check of some sort is required here.
      draggableItem: draggableItem as BoardItemDefinitionBase<any>,
      draggableElement,
      collisionIds: interactionType === "keyboard" || isElementOverBoard(draggableElement) ? collisionIds : [],
    });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ interactionType, collisionIds, positionOffset, draggableElement }) => {
    dispatch({
      type: "update-with-pointer",
      collisionIds: interactionType === "keyboard" || isElementOverBoard(draggableElement) ? collisionIds : [],
      positionOffset,
    });
  });

  useDragSubscription("submit", () => {
    dispatch({ type: "submit" });

    autoScrollHandlers.removePointerEventHandlers();

    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }
    if (!transition.layoutShift || transition.layoutShift.conflicts.length > 0) {
      return null;
    }

    const newItems = exportItemsLayout(transition.layoutShift, [...items, transition.draggableItem], columns, columns);
    const matchedItem = newItems.find((item) => item.id === transition.draggableItem.id);
    const addedItem = transition.operation === "insert" ? matchedItem! : undefined;
    onItemsChange(
      createCustomEvent({
        items: {
          xs: exportItemsLayout(transition.layoutShift, [...allItems.xs, transition.draggableItem], columns, 1),
          m: exportItemsLayout(transition.layoutShift, [...allItems.m, transition.draggableItem], columns, 2),
          xl: exportItemsLayout(transition.layoutShift, [...allItems.xl, transition.draggableItem], columns, 4),
          default: exportItemsLayout(
            transition.layoutShift,
            [...allItems.default, transition.draggableItem],
            columns,
            6
          ),
        },
        addedItem,
      })
    );
  });

  useDragSubscription("discard", () => {
    dispatch({ type: "discard" });

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("acquire", ({ droppableId, draggableItem }) => {
    const placeholder = placeholdersLayout.items.find((it) => it.id === droppableId);

    // If missing then it does not belong to this board.
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

    onItemsChange(
      createCustomEvent({
        items: {
          xs: allItems.xs.filter((it) => it !== removedItem),
          m: allItems.m.filter((it) => it !== removedItem),
          xl: allItems.xl.filter((it) => it !== removedItem),
          default: allItems.default.filter((it) => it !== removedItem),
        },
        removedItem,
      })
    );
  };

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function onItemMove(direction: Direction) {
    if (transition) {
      dispatch({ type: "update-with-keyboard", direction });
      autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
    }
  }

  const layoutShift = transition?.layoutShift ?? removeTransition?.layoutShift;
  const transforms = layoutShift ? createTransforms(itemsLayout, layoutShift.moves) : {};

  // Exclude drag target from transforms.
  if (transition && transition.interactionType === "pointer") {
    delete transforms[transition.draggableItem.id];
  }

  const announcement = transitionAnnouncement ? announcementToString(transitionAnnouncement, items, i18nStrings) : "";

  return (
    <div ref={__internalRootRef}>
      <ScreenReaderGridNavigation
        items={items}
        itemsLayout={itemsLayout}
        ariaLabel={i18nStrings.navigationAriaLabel}
        ariaDescription={i18nStrings.navigationAriaDescription}
        itemAriaLabel={i18nStrings.navigationItemAriaLabel}
        onActivateItem={focusItem}
      />

      <div ref={containerRef} className={clsx(styles.root, { [styles.empty]: rows === 0 })}>
        {rows > 0 ? (
          <Grid columns={columns} rows={rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
            {/* Placeholders are rendered even when there is no transition to support the first collisions check. */}
            {placeholdersLayout.items.map((placeholder) => (
              <Placeholder
                key={placeholder.id}
                id={placeholder.id}
                state={transition ? (transition.collisionIds?.has(placeholder.id) ? "hover" : "active") : "default"}
              />
            ))}

            {items.map((item) => {
              const layoutItem = layoutItemById.get(item.id);
              const isResizing = transition?.operation === "resize" && transition?.draggableItem.id === item.id;

              const itemSize = layoutItem ?? {
                width: getInsertingItemWidth(item, columns),
                height: getInsertingItemHeight(item),
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
                  transform={transforms[item.id]}
                  inTransition={!!layoutShift}
                  acquired={item.id === acquiredItem?.id}
                  itemSize={itemSize}
                  itemMaxSize={itemMaxSize}
                  onKeyMove={onItemMove}
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

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
