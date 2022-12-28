// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, TRANSITION_DURATION_MS } from "../internal/constants";
import { Operation, useDragSubscription } from "../internal/dnd-controller/controller";
import Grid from "../internal/grid";
import { DashboardItem, DashboardItemBase, Direction, GridLayoutItem, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { LayoutShift } from "../internal/layout-engine/interfaces";
import LiveRegion from "../internal/live-region";
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
import { getNextItem } from "./calculations/grid-navigation";
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
import { useAutoScroll } from "./use-auto-scroll";

interface Transition {
  operation: Operation;
  insertionDirection: null | Direction;
  draggableItem: DashboardItemBase<unknown>;
  draggableElement: HTMLElement;
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

  const [transition, setTransition] = useState<null | Transition>(null);
  const [acquiredItem, setAcquiredItem] = useState<null | DashboardItem<D>>(null);

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

  useDragSubscription("start", ({ operation, draggableItem, draggableElement, collisionIds }) => {
    const layoutItem = layoutItemById.get(draggableItem.id) ?? null;

    // Define starting path.
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const appendPath = operation === "resize" ? appendResizePath : appendMovePath;
    const path = layoutItem ? appendPath([], collisionRect) : [];

    setTransition({
      operation,
      insertionDirection: null,
      draggableItem,
      draggableElement,
      collisionIds: [],
      engine: new LayoutEngine(itemsLayout),
      layoutShift: null,
      path,
    });

    autoScrollHandlers.addPointerEventHandlers();
  });

  useDragSubscription("update", ({ operation, draggableItem, collisionIds, positionOffset }) => {
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

    const insertionDirection = transition.insertionDirection ?? getInsertionDirection(positionOffset);
    const layoutShift = getLayoutShift(transition, path, insertionDirection);

    if (layoutShift) {
      setTransitionDelayed({ ...transition, collisionIds, layoutShift, path, insertionDirection });
    }
  });

  useDragSubscription("submit", () => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    // Discard state first so that if there is an exception in the code below it doesn't prevent state update.
    setTransitionDelayed.cancel();
    setTransition(null);
    setAcquiredItem(null);

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

    setTransitionDelayed.cancel();
    setTransition(null);
    setAcquiredItem(null);

    autoScrollHandlers.removePointerEventHandlers();
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));
  };

  function focusItem(item: null | GridLayoutItem, direction: Direction) {
    if (item) {
      itemContainerRef.current[item.id].focusDragHandle();
      setAnnouncement("");
    } else {
      // TODO: use i18n-strings
      setAnnouncement(`No item to the ${direction}`);
    }
  }

  function updateManualItemTransition(transition: Transition, path: Position[]) {
    const layoutShift = getLayoutShift(transition, path);
    if (layoutShift) {
      setTransition({ ...transition, collisionIds: [], layoutShift, path });
      autoScrollHandlers.scheduleActiveElementScrollIntoView(TRANSITION_DURATION_MS);
    }
  }

  function shiftItem(transition: Transition, direction: Direction) {
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

  function onItemNavigate(itemId: ItemId, direction: Direction) {
    if (transition) {
      shiftItem(transition, direction);
    } else {
      focusItem(getNextItem(itemsLayout, layoutItemById.get(itemId)!, direction), direction);
    }
  }

  function acquireItem(position: Position) {
    if (!transition) {
      throw new Error("Invariant violation: no transition for acquire.");
    }

    const layoutRect = transition.draggableElement.getBoundingClientRect();
    const itemRect = transition.draggableElement.getBoundingClientRect();
    const offset = new Coordinates({ x: itemRect.x - layoutRect.x, y: itemRect.y - layoutRect.y });
    const insertionDirection = getInsertionDirection(offset);

    // Update original insertion position if the item can't fit into the layout by width.
    const width = getDefaultItemWidth(transition.draggableItem);
    position = new Position({ x: Math.min(columns - width, position.x), y: position.y });

    const path = [...transition.path, position];
    const layoutShift = getLayoutShift(transition, path, insertionDirection);

    if (!layoutShift) {
      throw new Error("Invariant violation: acquired item is not inserted into layout.");
    }

    // TODO: resolve "any" here.
    // The columnOffset, columnSpan and rowSpan are of no use as of being overridden by the layout shift.
    setAcquiredItem({ ...(transition.draggableItem as any), columnOffset: 0, columnSpan: 1, rowSpan: 1 });
    setTransition({ ...transition, collisionIds: [], layoutShift, path });
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

            // TODO: use i18n-strings
            const columnsDescription = layoutItem
              ? `columns ${layoutItem.x + 1} - ${layoutItem.x + layoutItem.width} of ${columns}`
              : "";
            const rowsDescription = layoutItem
              ? `rows ${layoutItem.y + 1} - ${layoutItem.y + layoutItem.height} of ${rows}`
              : "";
            const positionDescription = [columnsDescription, rowsDescription].filter(Boolean).join(", ");

            // TODO: use i18n-strings
            const dragInteractionDescription = !transition
              ? `Use Space or Enter to enter drag mode`
              : `To move the item use arrow keys. Press Space or Enter to submit or Esc to discard`;

            // TODO: use i18n-strings
            const resizeInteractionDescription = !transition
              ? `Use Space or Enter to enter resize mode`
              : `To resize the item use arrow keys. Press Space or Enter to submit or Esc to discard`;

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
                positionDescription={positionDescription}
                dragInteractionDescription={dragInteractionDescription}
                resizeInteractionDescription={resizeInteractionDescription}
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
