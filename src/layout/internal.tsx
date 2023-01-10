// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, TRANSITION_DURATION_MS } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, DashboardItemBase, Direction, GridLayoutItem, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import LiveRegion from "../internal/live-region";
import { createCustomEvent } from "../internal/utils/events";
import {
  createItemsLayout,
  createPlaceholdersLayout,
  exportItemsLayout,
  getDefaultItemSize,
} from "../internal/utils/layout";
import { Position } from "../internal/utils/position";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getNextItem } from "./calculations/grid-navigation";
import { createTransforms } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";
import { Action, Transition, useTransition } from "./transition";
import { useAutoScroll } from "./use-auto-scroll";

export default function DashboardLayout<D>({
  items,
  renderItem,
  onItemsChange,
  empty,
  i18nStrings,
}: DashboardLayoutProps<D>) {
  const [announcement, setAnnouncement] = useState("");

  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

  const autoScrollHandlers = useAutoScroll();

  const [transition, dispatch] = useTransition<D>(onTransitionAction);
  const acquiredItem = transition?.acquiredItem ?? null;

  function onTransitionAction(transition: null | Transition<D>, action: Action) {
    if (transition && (action.type === "update-with-keyboard" || action.type === "acquire-item")) {
      const direction = action.type === "update-with-keyboard" ? action.direction : null;
      setTransitionAnnouncement(transition, direction);
    }
  }

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

  const getDefaultItemWidth = (item: DashboardItemBase<unknown>) => Math.min(columns, getDefaultItemSize(item).width);
  const getDefaultItemHeight = (item: DashboardItemBase<unknown>) => getDefaultItemSize(item).height;

  // Rows can't be 0 as it would prevent placing the first item to the layout.
  let rows = itemsLayout.rows || 1;

  // The rows can be overridden during transition to create more drop targets at the bottom.
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

  useDragSubscription("start", ({ operation, interactionType, draggableItem, draggableElement, collisionIds }) => {
    dispatch({
      type: "init",
      operation,
      interactionType,
      itemsLayout,
      placeholdersLayout,
      draggableItem,
      draggableElement,
      collisionIds,
    });

    autoScrollHandlers.addPointerEventHandlers();

    if (items.some((it) => it.id === draggableItem.id)) {
      setAnnouncement(i18nStrings.liveAnnouncementOperationStarted(operation));
    } else {
      setAnnouncement("");
    }
  });

  useDragSubscription("update", ({ collisionIds, positionOffset }) => {
    dispatch({ type: "update-with-pointer", collisionIds, positionOffset });
  });

  useDragSubscription("submit", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    dispatch({ type: "clear" });

    if (transition.layoutShift) {
      if (transition.layoutShift.conflicts.length === 0) {
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

        setAnnouncement(i18nStrings.liveAnnouncementOperationCommitted(transition.operation));
      }
    }

    if (!transition.layoutShift || transition.layoutShift.conflicts.length > 0) {
      setAnnouncement(i18nStrings.liveAnnouncementOperationDiscarded(transition.operation));
    }

    autoScrollHandlers.removePointerEventHandlers();
  });

  useDragSubscription("discard", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    dispatch({ type: "clear" });

    autoScrollHandlers.removePointerEventHandlers();

    // Announce only if the target item belongs to the layout.
    if (items.some((it) => it.id === transition.draggableItem.id)) {
      setAnnouncement(i18nStrings.liveAnnouncementOperationDiscarded(transition.operation));
    }
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    const layoutShiftWithRefloat = new LayoutEngine(itemsLayout).remove(removedItem.id).refloat().getLayoutShift();

    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));

    const disturbedIds = new Set(layoutShiftWithRefloat.moves.map((move) => move.itemId));
    disturbedIds.delete(removedItem.id);
    const disturbed = [...disturbedIds].map((itemId) => items.find((it) => it.id === itemId)!);

    setAnnouncement(
      i18nStrings.liveAnnouncementOperation("remove", {
        item: removedItem,
        colspan: 0,
        rowspan: 0,
        columnOffset: 0,
        rowOffset: 0,
        columns,
        rows,
        direction: null,
        conflicts: [],
        disturbed: disturbed,
      })
    );
  };

  function focusItem(item: null | GridLayoutItem) {
    if (item) {
      itemContainerRef.current[item.id].focusDragHandle();
    }
    setAnnouncement("");
  }

  function shiftItem(direction: Direction) {
    dispatch({ type: "update-with-keyboard", direction });
    autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
  }

  function onItemNavigate(itemId: ItemId, direction: Direction) {
    if (transition) {
      shiftItem(direction);
    } else {
      focusItem(getNextItem(itemsLayout, layoutItemById.get(itemId)!, direction));
    }
  }

  function acquireItem(position: Position) {
    dispatch({ type: "acquire-item", position, layoutElement: containerAccessRef.current! });
  }

  function setTransitionAnnouncement(transition: Transition<D>, direction: null | Direction) {
    const { operation, layoutShift, layoutShiftWithRefloat } = transition;
    const targetItem = layoutItemById.get(transition.draggableItem.id) ?? null;

    if (!layoutShift || !layoutShiftWithRefloat) {
      return;
    }

    const firstMove = layoutShift.moves[0];
    const targetId = firstMove?.itemId ?? targetItem?.id;
    if (!targetId) {
      return;
    }

    const itemMoves = layoutShift.moves.filter((m) => m.itemId === targetId);
    const lastItemMove = itemMoves[itemMoves.length - 1];
    const placement = lastItemMove ?? targetItem;

    const item = items.find((it) => it.id === targetId)!;

    const conflicts = layoutShift.conflicts.map((conflictId) => items.find((it) => it.id === conflictId)!);

    const disturbedIds = new Set(layoutShiftWithRefloat.moves.map((move) => move.itemId));
    disturbedIds.delete(targetId);
    const disturbed = [...disturbedIds].map((itemId) => items.find((it) => it.id === itemId)!);

    setAnnouncement(
      i18nStrings.liveAnnouncementOperation(operation, {
        item,
        colspan: placement.width,
        rowspan: placement.height,
        columnOffset: placement.x,
        rowOffset: placement.y,
        columns,
        rows,
        direction,
        conflicts,
        disturbed,
      })
    );
  }

  const transforms = transition?.layoutShift ? createTransforms(itemsLayout, transition.layoutShift.moves) : {};
  if (transition && transition.interactionType === "pointer") {
    delete transforms[transition.draggableItem.id];
  }

  const showGrid = items.length > 0 || transition;

  // TODO: make sure empty / finished states announcements are considered.

  return (
    <div ref={containerRef} className={clsx(styles.root, { [styles.empty]: !showGrid })}>
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
              acquire={() => acquireItem(new Position({ x: placeholder.x, y: placeholder.y }))}
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

            const positionState = {
              item,
              colspan: layoutItem?.width ?? 0,
              rowspan: layoutItem?.height ?? 0,
              columnOffset: layoutItem?.x ?? 0,
              rowOffset: layoutItem?.y ?? 0,
              columns,
              rows,
            };

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
                onNavigate={(direction) => onItemNavigate(item.id, direction)}
                dragHandleAriaLabel={i18nStrings.itemDragHandleAriaLabel(positionState)}
                dragHandleAriaDescription={i18nStrings.itemDragHandleAriaDescription}
                resizeHandleAriaLabel={i18nStrings.itemResizeHandleAriaLabel(positionState)}
                resizeHandleAriaDescription={i18nStrings.itemResizeHandleAriaDescription}
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
