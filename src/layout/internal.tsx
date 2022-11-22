// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { Position } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import { createLayout } from "./calculations/create-layout";
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
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const pathRef = useRef<Position[]>([]);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createLayout(items, columns, isDragActive);

  useDragSubscription("start", ({ id, resize }) => {
    setIsDragActive(true);
    if (!resize) {
      const { x, y } = content.find((item) => item.id === id)!;
      pathRef.current = [{ x, y }];
    }
  });

  useDragSubscription("move", (detail) => {
    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholders);
    const layoutShift = detail.resize
      ? calculateResizeShifts(content, collisionRect, detail.id, columns)
      : calculateReorderShifts(content, collisionRect, detail.id, pathRef.current, columns);

    pathRef.current = layoutShift.path;
    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    setCollisionIds(collisionIds);
    setTransforms(createTransforms(content, layoutShift.moves, cellRect));
  });

  useDragSubscription("drop", (detail) => {
    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholders);
    const layoutShift = detail.resize
      ? calculateResizeShifts(content, collisionRect, detail.id, columns)
      : calculateReorderShifts(content, collisionRect, detail.id, pathRef.current, columns);
    printLayoutDebug(content, columns, layoutShift);

    setTransforms({});
    setIsDragActive(false);
    setCollisionIds(null);
    pathRef.current = [];

    // Commit new layout.
    if (!layoutShift.hasConflicts) {
      onItemsChange(createCustomEvent({ items: exportLayout(layoutShift.items, items) }));
    }
  });

  return (
    <div ref={containerQueryRef as Ref<HTMLDivElement>}>
      <Grid columns={columns} rows={rows} layout={[...placeholders, ...content]}>
        {placeholders.map((placeholder) => (
          <Placeholder
            key={placeholder.id}
            id={placeholder.id}
            state={isDragActive ? (collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"}
          />
        ))}
        {items.map((item) => {
          return (
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
          );
        })}
      </Grid>
    </div>
  );
}
