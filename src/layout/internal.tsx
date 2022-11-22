// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { GridLayoutItem, Position, Rect } from "../internal/interfaces";
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

export default function DashboardLayout<D>({
  items,
  renderItem,
  onItemsChange,
  resolveNewItem,
}: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [collisionIds, setCollisionIds] = useState<null | Array<string>>(null);
  const [activeDragItem, setActiveDragItem] = useState<null | GridLayoutItem>(null);
  const [addedItem, setAddedItem] = useState<null | DashboardLayoutProps.Item<D>>(null);
  const [interactionType, setInteractionType] = useState<"move" | "resize" | "insert">("move");
  const pathRef = useRef<Position[]>([]);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;

  const itemsLayout = createItemsLayout(items, columns);
  const rows = !activeDragItem ? itemsLayout.rows : itemsLayout.rows + activeDragItem.height;

  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  useDragSubscription("start", ({ id, resize }) => {
    const existingItem = itemsLayout.items.find((item) => item.id === id) ?? null;

    // Move or resize.
    if (existingItem) {
      setActiveDragItem(existingItem);

      if (resize) {
        setInteractionType("resize");
      } else {
        setInteractionType("move");
        pathRef.current = [{ x: existingItem.x, y: existingItem.y }];
      }

      return true;
    }

    // Insert.
    else if (resolveNewItem) {
      const addedItem = resolveNewItem(id);
      if (addedItem) {
        setAddedItem(addedItem as any);
        setInteractionType("insert");
        setActiveDragItem({
          id: addedItem.id,
          width: addedItem.definition.defaultColumnSpan,
          height: addedItem.definition.defaultRowSpan,
          x: 0,
          y: 0,
        });
        return true;
      }
    }

    return false;
  });

  function getLayoutShift(collisionRect: Rect) {
    if (!activeDragItem) {
      throw new Error("Invariant violation: no active item.");
    }

    switch (interactionType) {
      case "move":
        return calculateReorderShifts(itemsLayout, collisionRect, activeDragItem?.id, pathRef.current);
      case "resize":
        return calculateResizeShifts(itemsLayout, collisionRect, activeDragItem?.id);
      case "insert":
        return calculateInsertShifts(itemsLayout, collisionRect, activeDragItem);
    }
  }

  useDragSubscription("move", (detail) => {
    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const layoutShift = getLayoutShift(collisionRect);

    pathRef.current = layoutShift.path;
    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    setCollisionIds(collisionIds);
    setTransforms(createTransforms(itemsLayout, layoutShift.moves, cellRect));
  });

  useDragSubscription("drop", (detail) => {
    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const layoutShift = getLayoutShift(collisionRect);

    printLayoutDebug(itemsLayout, layoutShift);

    setTransforms({});
    setActiveDragItem(null);
    setCollisionIds(null);
    pathRef.current = [];

    // Commit new layout.
    if (!layoutShift.hasConflicts) {
      if (interactionType === "insert") {
        onItemsChange(
          createCustomEvent({
            items: exportItemsLayout(layoutShift.next, [...items, addedItem]),
            addedItem: addedItem!,
          })
        );
      } else {
        onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items) }));
      }
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
              id: item.id,
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
