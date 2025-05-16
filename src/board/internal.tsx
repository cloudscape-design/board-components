// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ReactNode, useEffect, useRef } from "react";
import { usePrevious } from "@dnd-kit/utilities";
import clsx from "clsx";

import { getIsRtl, useMergeRefs } from "@cloudscape-design/component-toolkit/internal";

import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { useContainerColumns } from "../internal/breakpoints";
import { TRANSITION_DURATION_MS } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { useGlobalDragStateStyles } from "../internal/global-drag-state-styles";
import Grid from "../internal/grid";
import { BoardItemDefinition, BoardItemDefinitionBase, Direction, ItemId, Rect } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import {
  createPlaceholdersLayout,
  getDefaultColumnSpan,
  getDefaultRowSpan,
  getMinColumnSpan,
  getMinRowSpan,
  interpretItems,
} from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useAutoScroll } from "../internal/utils/use-auto-scroll";
import { BoardProps } from "./interfaces";
import Placeholder from "./placeholder";
import { selectTransitionRows, useTransition } from "./transition";
import { announcementToString } from "./utils/announcements";
import { createTransforms } from "./utils/create-transforms";
import { createItemsChangeEvent } from "./utils/events";

import styles from "./styles.css.js";

export function InternalBoard<D>({
  items,
  renderItem,
  onItemsChange,
  empty,
  i18nStrings,
  __internalRootRef,
  ...rest
}: BoardProps<D> & InternalBaseComponentProps) {
  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [currentColumns, containerQueryRef] = useContainerColumns();
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

  const isRtl = () => getIsRtl(containerAccessRef.current);

  useGlobalDragStateStyles();

  const autoScrollHandlers = useAutoScroll();

  const [transitionState, dispatch] = useTransition<D>({ isRtl });
  const transition = transitionState.transition;
  const removeTransition = transitionState.removeTransition;
  const transitionAnnouncement = transitionState.announcement;
  const acquiredItem = transition?.acquiredItem ?? null;
  const acquiredItemElement = transition?.acquiredItemElement;

  // Using cached columns from transition to ensure no unexpected changes in the process.
  const columns = transition ? transition.itemsLayout.columns : currentColumns;

  // Use previous items while remove transition is in progress.
  items = removeTransition?.items ?? items;

  // The acquired item is the one being inserting at the moment but not submitted yet.
  // It needs to be included to the layout to be a part of layout shifts and rendering.
  items = acquiredItem ? [...items, acquiredItem] : items;
  const itemsLayout = interpretItems(items, columns);

  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));
  const layoutItemIndexById = new Map(itemsLayout.items.map((item, index) => [item.id, index]));

  // Items and layout items must maintain the same order visually, in the DOM and in the data
  // to ensure on-change events and tab order work as expected.
  items = [...items].sort((a, b) => (layoutItemIndexById.get(a.id) ?? -1) - (layoutItemIndexById.get(b.id) ?? -1));

  // When an item gets acquired or removed the focus needs to be dispatched on the next render.
  const focusNextRenderIdRef = useRef<null | ItemId>(null);
  useEffect(() => {
    const focusTarget = focusNextRenderIdRef.current;
    if (focusTarget) {
      itemContainerRef.current[focusTarget].focusDragHandle();
    }
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
      const newItems = createItemsChangeEvent(items, removeTransition.layoutShift);
      const itemIdToFocus = newItems.detail.items[nextIndexToFocus]?.id;

      if (itemIdToFocus) {
        itemContainerRef.current[itemIdToFocus].focusDragHandle();
      }
      onItemsChange(newItems);
    }, TRANSITION_DURATION_MS);

    return () => clearTimeout(timeoutId);
  }, [removeTransition, items, onItemsChange]);

  // When item is inserting with the keyboard it keeps rendering by the palette and upon submission
  // it starts rendering by the board. This transitions might lead to the focus being lost from the item's drag handle.
  // The below code refocuses the drag handle when detecting the acquired item is no longer used.
  const acquiredItemId = usePrevious(acquiredItem?.id);
  const previousAcquiredItemElement = usePrevious(acquiredItemElement);
  useEffect(() => {
    if (acquiredItemId && previousAcquiredItemElement && !acquiredItemElement) {
      itemContainerRef.current[acquiredItemId]?.focusDragHandle();
    }
  }, [acquiredItemId, previousAcquiredItemElement, acquiredItemElement]);

  const rows = selectTransitionRows(transitionState) || itemsLayout.rows;
  const placeholdersLayout = createPlaceholdersLayout(rows, itemsLayout.columns);

  function isElementOverBoard(rect: Rect) {
    const board = containerAccessRef.current!;
    const boardContains = (target: null | Element) => board === target || board.contains(target);
    const left = !isRtl() ? rect.left : document.documentElement.clientWidth - rect.left;
    const right = !isRtl() ? rect.right : document.documentElement.clientWidth - rect.right;
    const { top, bottom } = rect;
    return (
      boardContains(document.elementFromPoint(left, top)) ||
      boardContains(document.elementFromPoint(right, top)) ||
      boardContains(document.elementFromPoint(right, bottom)) ||
      boardContains(document.elementFromPoint(left, bottom))
    );
  }

  useDragSubscription("start", ({ operation, interactionType, draggableItem, collisionRect, collisionIds }) => {
    dispatch({
      type: "init",
      operation,
      interactionType,
      itemsLayout,
      // TODO: resolve any
      // The code only works assuming the board can take any draggable.
      // If draggables can be of different types a check of some sort is required here.
      draggableItem: draggableItem as BoardItemDefinitionBase<any>,
      draggableRect: collisionRect,
      collisionIds: interactionType === "pointer" && isElementOverBoard(collisionRect) ? collisionIds : [],
    });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ interactionType, collisionIds, positionOffset, collisionRect }) => {
    dispatch({
      type: "update-with-pointer",
      collisionIds: interactionType === "pointer" && isElementOverBoard(collisionRect) ? collisionIds : [],
      positionOffset,
      draggableRect: collisionRect,
    });
  });

  useDragSubscription("submit", () => {
    dispatch({ type: "submit" });

    autoScrollHandlers.removePointerEventHandlers();

    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }
    if (
      !transition.layoutShift ||
      transition.layoutShift.conflicts.length > 0 ||
      transition.layoutShift.moves.length === 0
    ) {
      return null;
    }

    // Commit new layout for insert case.
    if (transition.operation === "insert") {
      onItemsChange(createItemsChangeEvent([...items, transition.draggableItem], transition.layoutShift));
    }
    // Commit new layout for reorder/resize case.
    else {
      onItemsChange(createItemsChangeEvent(items, transition.layoutShift));
    }
  });

  useDragSubscription("discard", () => {
    dispatch({ type: "discard" });

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("acquire", ({ droppableId, draggableItem, renderAcquiredItem }) => {
    const placeholder = placeholdersLayout.items.find((it) => it.id === droppableId);

    // If missing then it does not belong to this board.
    if (!placeholder) {
      return;
    }

    dispatch({
      type: "acquire-item",
      position: new Position({ x: placeholder.x, y: placeholder.y }),
      layoutElement: containerAccessRef.current!,
      acquiredItemElement: renderAcquiredItem(),
    });
    focusNextRenderIdRef.current = draggableItem.id;
  });

  const removeItemAction = (removedItem: BoardItemDefinition<D>) => {
    dispatch({ type: "init-remove", items, itemsLayout, removedItem });
  };

  function onItemMove(direction: Direction) {
    if (transition) {
      dispatch({ type: "update-with-keyboard", direction });
      autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
    }
  }

  const announcement = transitionAnnouncement
    ? announcementToString(transitionAnnouncement, items, i18nStrings, itemsLayout.columns)
    : "";

  return (
    <div ref={__internalRootRef} {...getDataAttributes(rest)}>
      <div ref={containerRef} className={clsx(styles.root, { [styles.empty]: rows === 0 })}>
        {rows > 0 ? (
          <Grid
            isRtl={isRtl}
            columns={itemsLayout.columns}
            layout={[...placeholdersLayout.items, ...itemsLayout.items]}
          >
            {(gridContext) => {
              const layoutShift = transition?.layoutShift ?? removeTransition?.layoutShift;
              const transforms = layoutShift ? createTransforms(itemsLayout, layoutShift.moves, gridContext) : {};

              // Exclude drag target from transforms.
              if (transition && transition.interactionType === "pointer") {
                delete transforms[transition.draggableItem.id];
              }

              const children: ReactNode[] = [];

              /* Placeholders are rendered even when there is no transition to support the first collisions check. */
              placeholdersLayout.items.forEach((placeholder) =>
                children.push(
                  <Placeholder
                    key={placeholder.id}
                    id={placeholder.id}
                    state={transition ? (transition.collisionIds?.has(placeholder.id) ? "hover" : "active") : "default"}
                    gridContext={gridContext}
                    columns={itemsLayout.columns}
                  />,
                ),
              );

              items.forEach((item) => {
                const layoutItem = layoutItemById.get(item.id);
                const isResizing = transition?.operation === "resize" && transition?.draggableItem.id === item.id;

                const itemSize = layoutItem ?? {
                  width: getDefaultColumnSpan(item, itemsLayout.columns),
                  height: getDefaultRowSpan(item),
                };

                const itemMaxSize =
                  isResizing && layoutItem ? { width: itemsLayout.columns - layoutItem.x, height: 999 } : itemSize;

                children.push(
                  <ItemContainer
                    key={item.id}
                    ref={(elem) => {
                      if (elem) {
                        itemContainerRef.current[item.id] = elem;
                      } else {
                        delete itemContainerRef.current[item.id];
                      }
                    }}
                    item={item}
                    transform={transforms[item.id]}
                    inTransition={!!transition || !!removeTransition}
                    placed={item.id !== acquiredItem?.id}
                    acquired={item.id === acquiredItem?.id}
                    getItemSize={() => ({
                      width: gridContext.getWidth(itemSize.width),
                      minWidth: gridContext.getWidth(getMinColumnSpan(item, itemsLayout.columns)),
                      maxWidth: gridContext.getWidth(itemMaxSize.width),
                      height: gridContext.getHeight(itemSize.height),
                      minHeight: gridContext.getHeight(getMinRowSpan(item)),
                      maxHeight: gridContext.getHeight(itemMaxSize.height),
                    })}
                    onKeyMove={onItemMove}
                    isRtl={isRtl}
                  >
                    {item.id === acquiredItem?.id && acquiredItemElement
                      ? () => acquiredItemElement
                      : () => renderItem(item, { removeItem: () => removeItemAction(item) })}
                  </ItemContainer>,
                );
              });

              return children;
            }}
          </Grid>
        ) : (
          empty
        )}
      </div>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
