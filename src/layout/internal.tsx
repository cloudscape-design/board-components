// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd";
import { toString as engineToString } from "../internal/dnd-engine/debug-tools";
import { Position } from "../internal/dnd-engine/interfaces";
import Grid from "../internal/grid";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";

import { getCollisions } from "./calculations/collision";
import { createLayout } from "./calculations/create-layout";
import { exportLayout } from "./calculations/export-layout";
import { calculateShifts, createTransforms } from "./calculations/reorder";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

export default function DashboardLayout<D>({ items, renderItem, onItemsChange }: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [collisionIds, setCollisionIds] = useState<null | Array<string>>(null);
  const [activeDragGhost, setActiveDragGhost] = useState<boolean>(false);
  const pathRef = useRef<Position[]>([]);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createLayout(items, columns, activeDragGhost);

  useDragSubscription("start", ({ activeId }) => {
    setActiveDragGhost(true);

    const { x, y } = content.find((item) => item.id === activeId)!;
    pathRef.current = [{ x, y }];
  });
  useDragSubscription("move", ({ active, activeId, droppables }) => {
    const collisionsIds = getCollisions(active, droppables);
    setCollisionIds(collisionsIds);
    const layoutShift = calculateShifts(
      content,
      collisionsIds.map((id) => placeholders.find((p) => p.id === id)!),
      activeId,
      pathRef.current,
      columns
    );
    pathRef.current = layoutShift.path;
    const cellRect = droppables[0][1].getBoundingClientRect();
    setTransforms(createTransforms(content, layoutShift.moves, cellRect));
  });
  useDragSubscription("drop", ({ active, activeId, droppables }) => {
    const collisionsIds = getCollisions(active, droppables);
    const layoutShift = calculateShifts(
      content,
      collisionsIds.map((id) => placeholders.find((p) => p.id === id)!),
      activeId,
      pathRef.current,
      columns
    );

    // Logs for dnd-engine debugging.
    console.log("Grid before move:");
    console.log(engineToString({ items: content, width: columns }));

    console.log("Grid after move:");
    console.log(engineToString({ items: layoutShift.items, width: columns }));

    console.log("Layout shift:");
    console.log(layoutShift);

    setTransforms({});
    setActiveDragGhost(false);
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
            state={activeDragGhost ? (collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"}
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
