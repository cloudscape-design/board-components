// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { DashboardItem, DashboardItemBase, GridLayoutItem, ItemId, Position } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { LayoutEngine } from "../internal/layout-engine/engine";
import { createCustomEvent } from "../internal/utils/events";
import { isIntersecting } from "../internal/utils/geometry";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getHoveredRect } from "./calculations/collision";
import { appendPath, createTransforms, printLayoutDebug } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";
import styles from "./styles.css.js";

interface Transition {
  isResizing: boolean;
  engine: LayoutEngine;
  transforms: { [itemId: ItemId]: Position };
  collisionIds: ItemId[];
  draggableItem: DashboardItemBase<unknown>;
  layoutItem: null | GridLayoutItem;
  path: Position[];
  rows: number;
}

function getLayoutShift(transition: Transition, path: Position[]) {
  if (transition.isResizing) {
    return transition.engine.resize({ itemId: transition.draggableItem.id, path: path.slice(1) }).getLayoutShift();
  }

  if (transition.layoutItem) {
    return transition.engine.move({ itemId: transition.draggableItem.id, path: path.slice(1) }).getLayoutShift();
  }

  const itemId = transition.draggableItem.id;
  const width = transition.draggableItem.definition.defaultColumnSpan;
  const height = transition.draggableItem.definition.defaultRowSpan;
  const [enteringPosition, ...movePath] = transition.path;
  const layoutItem = { id: itemId, width, height, ...enteringPosition };
  return transition.engine.insert(layoutItem).move({ itemId, path: movePath }).getLayoutShift();
}

export default function DashboardLayout<D>({ items, renderItem, onItemsChange, empty }: DashboardLayoutProps<D>) {
  const containerAccessRef = useRef<HTMLDivElement>(null);
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const containerRef = useMergeRefs(containerAccessRef, containerQueryRef);
  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;

  const [transition, setTransition] = useState<null | Transition>(null);

  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));
  // Rows can't be 0 as it would prevent placing the first item to the layout.
  const rows = (transition?.rows ?? itemsLayout.rows) || 1;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function checkCanDrop(itemEl: HTMLElement): boolean {
    const containerRect = containerAccessRef.current!.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    return isIntersecting(containerRect, itemRect);
  }

  useDragSubscription("start", (detail) => {
    const layoutItem = layoutItemById.get(detail.draggableItem.id) ?? null;

    // Define starting path.
    const collisionRect = getHoveredRect(detail.collisionIds, placeholdersLayout.items);
    const path = layoutItem
      ? appendPath([], collisionRect, columns, layoutItem.width, detail.operation === "resize")
      : [];

    // Override rows to plan for possible height increase.
    const itemHeight = layoutItem ? layoutItem.height : detail.draggableItem.definition.defaultRowSpan;
    const rows = detail.operation === "resize" ? itemsLayout.rows : itemsLayout.rows + itemHeight;

    const canDrop = checkCanDrop(detail.draggableElement);
    const transition = {
      isResizing: detail.operation === "resize",
      engine: new LayoutEngine(itemsLayout),
      transforms: {},
      collisionIds: [],
      draggableItem: detail.draggableItem,
      layoutItem,
      path,
      rows,
    };
    setTransition(canDrop ? transition : { ...transition, rows: itemsLayout.rows });
  });

  useDragSubscription("move", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const itemWidth = transition.layoutItem
      ? transition.layoutItem.width
      : transition.draggableItem.definition.defaultColumnSpan;
    const itemHeight = transition.layoutItem
      ? transition.layoutItem.height
      : transition.draggableItem.definition.defaultRowSpan;

    const collisionRect = getHoveredRect(detail.collisionIds, placeholdersLayout.items);
    const path = appendPath(transition.path, collisionRect, columns, itemWidth, detail.operation === "resize");
    const layoutShift = getLayoutShift(transition, path);

    const transforms = createTransforms(itemsLayout, layoutShift.moves);

    const rows = layoutShift.next.rows + itemHeight;
    const canDrop = checkCanDrop(detail.draggableElement);

    setTransition(
      canDrop
        ? { ...transition, collisionIds: detail.collisionIds, transforms, path, rows }
        : { ...transition, collisionIds: [], transforms: {}, rows: itemsLayout.rows }
    );
  });

  useDragSubscription("drop", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    // Discard state first so that if there is an exption in the code below it doesn't prevent state update.
    setTransition(null);

    const itemWidth = transition.layoutItem
      ? transition.layoutItem.width
      : transition.draggableItem.definition.defaultColumnSpan;

    const collisionRect = getHoveredRect(detail.collisionIds, placeholdersLayout.items);
    const path = appendPath(transition.path, collisionRect, columns, itemWidth, detail.operation === "resize");
    const layoutShift = getLayoutShift(transition, path);
    const canDrop = checkCanDrop(detail.draggableElement);

    printLayoutDebug(itemsLayout, layoutShift);

    if (!canDrop || layoutShift.conflicts.length > 0) {
      return;
    }

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
  });

  const removeItemAction = (removedItem: DashboardItem<D>) => {
    const layoutShift = new LayoutEngine(itemsLayout).remove(removedItem.id).getLayoutShift();
    onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items), removedItem }));
  };

  const showGrid = items.length > 0 || transition;

  // TODO: make sure empty / finished states announcements are considered.

  return (
    <div ref={containerRef} className={styles.root}>
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
            let itemSize = layoutItem ?? {
              width: item.definition.defaultColumnSpan,
              height: item.definition.defaultRowSpan,
            };

            // Pass item's max allowed size to use as boundaries for resizing.
            if (isResizing && layoutItem) {
              itemSize = {
                width: columns - layoutItem.x,
                height: 999,
              };
            }

            return (
              <ItemContextProvider
                key={item.id}
                value={{
                  item,
                  itemSize,
                  transform: transition?.transforms[item.id] ?? null,
                }}
              >
                {renderItem(item, { removeItem: () => removeItemAction(item) })}
              </ItemContextProvider>
            );
          })}
        </Grid>
      ) : (
        empty
      )}
    </div>
  );
}
