// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { GridLayoutItem, Position } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import { createItemsLayout, createPlaceholdersLayout } from "./calculations/create-layout";
import { exportLayout } from "./calculations/export-layout";
import {
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
  const [activeDragItem, setActiveDragItem] = useState<null | GridLayoutItem>(null);
  const pathRef = useRef<Position[]>([]);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;

  const itemsLayout = createItemsLayout(items, columns, activeDragItem);
  const placeholdersLayout = createPlaceholdersLayout(itemsLayout.rows, itemsLayout.columns);

  useDragSubscription("start", ({ id, resize }) => {
    const activeDragItem = itemsLayout.items.find((item) => item.id === id)!;

    setActiveDragItem(activeDragItem);

    if (!resize) {
      pathRef.current = [{ x: activeDragItem.x, y: activeDragItem.y }];
    }
  });

  useDragSubscription("move", (detail) => {
    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const layoutShift = detail.resize
      ? calculateResizeShifts(itemsLayout, collisionRect, detail.id)
      : calculateReorderShifts(itemsLayout, collisionRect, detail.id, pathRef.current);

    pathRef.current = layoutShift.path;
    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    setCollisionIds(collisionIds);
    setTransforms(createTransforms(itemsLayout, layoutShift.moves, cellRect));
  });

  useDragSubscription("drop", (detail) => {
    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const layoutShift = detail.resize
      ? calculateResizeShifts(itemsLayout, collisionRect, detail.id)
      : calculateReorderShifts(itemsLayout, collisionRect, detail.id, pathRef.current);
    printLayoutDebug(itemsLayout, layoutShift);

    setTransforms({});
    setActiveDragItem(null);
    setCollisionIds(null);
    pathRef.current = [];

    // Commit new layout.
    if (!layoutShift.hasConflicts) {
      onItemsChange(createCustomEvent({ items: exportLayout(layoutShift.next, items) }));
    }
  });

  return (
    <div ref={containerQueryRef as Ref<HTMLDivElement>}>
      <Grid columns={columns} rows={itemsLayout.rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
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
