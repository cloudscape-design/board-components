// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { DashboardItemBase, Position, Rect } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import {
  calculateInsertShifts,
  calculateReorderShifts,
  calculateResizeShifts,
  createTransforms,
  printLayoutDebug,
} from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

export default function DashboardLayout<D>({ items, renderItem, onItemsChange }: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [collisionIds, setCollisionIds] = useState<null | Array<string>>(null);
  const [activeDragItem, setActiveDragItem] = useState<null | DashboardItemBase<unknown>>(null);
  const [rowsOverride, setRowsOverride] = useState<null | number>(null);
  const pathRef = useRef<Position[]>([]);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;

  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));
  const matchedLayoutItem = activeDragItem && layoutItemById.get(activeDragItem.id);
  const rows = rowsOverride ?? itemsLayout.rows;

  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function getLayoutShift(resize: boolean, collisionRect: Rect) {
    if (!activeDragItem) {
      throw new Error("Invariant violation: no matched item.");
    }
    if (resize) {
      return calculateResizeShifts(itemsLayout, collisionRect, activeDragItem.id);
    }
    return matchedLayoutItem
      ? calculateReorderShifts(itemsLayout, collisionRect, activeDragItem.id, pathRef.current)
      : calculateInsertShifts(itemsLayout, collisionRect, activeDragItem);
  }

  useDragSubscription("start", (detail) => {
    setActiveDragItem(detail.item);

    const matchedItem = layoutItemById.get(detail.item.id);
    if (matchedItem && !detail.resize) {
      pathRef.current = [{ x: matchedItem.x, y: matchedItem.y }];
    }

    const itemHeight = matchedItem ? matchedItem.height : detail.item.definition.defaultRowSpan;
    if (!detail.resize) {
      setRowsOverride(itemsLayout.rows + itemHeight);
    }
  });

  useDragSubscription("move", (detail) => {
    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const layoutShift = getLayoutShift(detail.resize, collisionRect);

    pathRef.current = layoutShift.path;
    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    setCollisionIds(collisionIds);
    setTransforms(createTransforms(itemsLayout, layoutShift.moves, cellRect));

    const itemHeight = matchedLayoutItem ? matchedLayoutItem.height : detail.item.definition.defaultRowSpan;
    setRowsOverride(layoutShift.next.rows + itemHeight);
  });

  useDragSubscription("drop", (detail) => {
    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const layoutShift = getLayoutShift(detail.resize, collisionRect);

    printLayoutDebug(itemsLayout, layoutShift);

    setTransforms({});
    setActiveDragItem(null);
    setCollisionIds(null);
    setRowsOverride(null);
    pathRef.current = [];

    // Commit new layout for insert case.
    if (!layoutShift.hasConflicts && !matchedLayoutItem) {
      // TODO: resolve "any" here.
      // It is not quite clear yet how to ensure the addedItem matches generic D type.
      const newLayout = exportItemsLayout(layoutShift.next, [...items, activeDragItem!] as any);
      const addedItem = newLayout.find((item) => item.id === activeDragItem?.id)!;
      onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
    }
    // Commit new layout for reorder/resize case.
    else if (!layoutShift.hasConflicts) {
      onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items) }));
    }
  });

  return (
    <div ref={containerQueryRef as Ref<HTMLDivElement>}>
      <Grid columns={columns} rows={rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
        {placeholdersLayout.items.map((placeholder) => (
          <Placeholder
            key={placeholder.id}
            id={placeholder.id}
            state={activeDragItem ? (collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"}
          />
        ))}
        {items.map((item) => (
          <ItemContextProvider
            key={item.id}
            value={{
              item,
              itemSize: layoutItemById.get(item.id) ?? {
                width: item.definition.defaultColumnSpan,
                height: item.definition.defaultRowSpan,
              },
              resizable: true,
              transform: transforms[item.id] ?? null,
            }}
          >
            {renderItem(item)}
          </ItemContextProvider>
        ))}
      </Grid>
    </div>
  );
}
