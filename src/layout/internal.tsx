// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL, MAX_ITEM_HEIGHT } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import { DndEngine } from "../internal/dnd-engine/engine";
import Grid from "../internal/grid";
import { DashboardItemBase, GridLayoutItem, ItemId, Position, Rect } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { isIntersecting } from "../internal/utils/geometry";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { useMergeRefs } from "../internal/utils/use-merge-refs";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import { appendPath, createTransforms, printLayoutDebug } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

interface Transition {
  type: "reorder" | "resize" | "insert";
  engine: DndEngine;
  transforms: { [itemId: ItemId]: Transform };
  collisionIds: ItemId[];
  item: DashboardItemBase<unknown>;
  layoutItem: null | GridLayoutItem;
  path: Position[];
  rows: number;
}

function getLayoutShift(transition: Transition, collisionRect: Rect, path: Position[]) {
  switch (transition.type) {
    case "resize": {
      return transition.engine
        .resize({
          itemId: transition.item.id,
          height: collisionRect.bottom - collisionRect.top,
          width: collisionRect.right - collisionRect.left,
        })
        .getLayoutShift();
    }
    case "insert": {
      const width = transition.item.definition.defaultColumnSpan;
      const height = transition.item.definition.defaultRowSpan;
      const [enteringPosition, ...movePath] = transition.path;
      const layoutItem = { id: transition.item.id, width, height, ...enteringPosition };
      return transition.engine.insert(layoutItem).move({ itemId: transition.item.id, path: movePath }).getLayoutShift();
    }
    case "reorder": {
      return transition.engine.move({ itemId: transition.item.id, path: path.slice(1) }).getLayoutShift();
    }
  }
}

export default function DashboardLayout<D>({ items, renderItem, onItemsChange }: DashboardLayoutProps<D>) {
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
  const rows = transition?.rows ?? itemsLayout.rows;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function checkCanDrop(itemEl: HTMLElement): boolean {
    // TODO: calculate container Rect once or per rows change.
    const containerRect = containerAccessRef.current!.getBoundingClientRect();
    // TODO: calculate item Rect once and adjust based on cursor position.
    const itemRect = itemEl.getBoundingClientRect();
    return isIntersecting(containerRect, itemRect);
  }

  useDragSubscription("start", (detail) => {
    const item = detail.item;
    const layoutItem = layoutItemById.get(detail.item.id) ?? null;

    const type: Transition["type"] = detail.resize ? "resize" : layoutItem ? "reorder" : "insert";

    // Define starting path for reorder.
    const path = layoutItem && !detail.resize ? [{ x: layoutItem.x, y: layoutItem.y }] : [];

    // Override rows to plan for possible height increase.
    const itemHeight = layoutItem ? layoutItem.height : item.definition.defaultRowSpan;
    const rows = detail.resize ? itemsLayout.rows : itemsLayout.rows + itemHeight;

    const canDrop = checkCanDrop(detail.containerRef.current!);
    const transition = {
      type,
      engine: new DndEngine(itemsLayout),
      transforms: {},
      collisionIds: [],
      item,
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
      : transition.item.definition.defaultColumnSpan;
    const itemHeight = transition.layoutItem ? transition.layoutItem.height : transition.item.definition.defaultRowSpan;

    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const path = appendPath(transition.path, collisionRect, columns, itemWidth);
    const layoutShift = getLayoutShift(transition, collisionRect, path);

    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    const transforms = createTransforms(itemsLayout, layoutShift.moves, cellRect);

    const rows = layoutShift.next.rows + itemHeight;
    const canDrop = checkCanDrop(detail.containerRef.current!);

    setTransition(
      canDrop
        ? { ...transition, collisionIds, transforms, path, rows }
        : { ...transition, collisionIds: [], transforms: {}, rows: itemsLayout.rows }
    );
  });

  useDragSubscription("drop", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const itemWidth = transition.layoutItem
      ? transition.layoutItem.width
      : transition.item.definition.defaultColumnSpan;

    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const path = appendPath(transition.path, collisionRect, columns, itemWidth);
    const layoutShift = getLayoutShift(transition, collisionRect, path);
    const canDrop = checkCanDrop(detail.containerRef.current!);

    printLayoutDebug(itemsLayout, layoutShift);

    setTransition(null);

    if (!canDrop || layoutShift.conflicts.length > 0) {
      return;
    }

    // Commit new layout for insert case.
    if (!transition.layoutItem) {
      // TODO: resolve "any" here.
      // It is not quite clear yet how to ensure the addedItem matches generic D type.
      const newLayout = exportItemsLayout(layoutShift.next, [...items, transition.item] as any);
      const addedItem = newLayout.find((item) => item.id === transition.item.id)!;
      onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
    }
    // Commit new layout for reorder/resize case.
    else {
      onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items) }));
    }
  });

  return (
    <div ref={containerRef}>
      <Grid columns={columns} rows={rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
        {placeholdersLayout.items.map((placeholder) => (
          <Placeholder
            key={placeholder.id}
            id={placeholder.id}
            state={
              transition?.item ? (transition.collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"
            }
          />
        ))}
        {items.map((item) => {
          const layoutItem = layoutItemById.get(item.id);
          const isResizing = transition && transition.type === "resize" && transition.item.id === item.id;

          // Take item's layout size or item's definition defaults to be used for insert and reorder.
          let itemSize = layoutItem ?? {
            width: item.definition.defaultColumnSpan,
            height: item.definition.defaultRowSpan,
          };

          // Pass item's max allowed size to use as boundaries for resizing.
          if (isResizing && layoutItem) {
            itemSize = {
              width: columns - layoutItem.x,
              height: MAX_ITEM_HEIGHT,
            };
          }

          return (
            <ItemContextProvider
              key={item.id}
              value={{
                item,
                itemSize,
                resizable: true,
                transform: transition?.transforms[item.id] ?? null,
              }}
            >
              {renderItem(item)}
            </ItemContextProvider>
          );
        })}
      </Grid>
    </div>
  );
}
