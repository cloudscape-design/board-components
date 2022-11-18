// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd";
import { toString as engineToString } from "../internal/dnd-engine/debug-tools";
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

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createLayout(items, columns, activeDragGhost);

  useDragSubscription("start", () => setActiveDragGhost(true));
  useDragSubscription("move", ({ active, activeId, droppableIds, droppables }) => {
    const collisionsIds = getCollisions(active, droppables, droppableIds);
    setCollisionIds(collisionsIds);
    const layoutShift = calculateShifts(
      content,
      collisionsIds.map((id) => placeholders.find((p) => p.id === id)!),
      content.find((item) => item.id === activeId)!,
      columns
    );
    setTransforms(createTransforms(layoutShift.current.items, content, active.getBoundingClientRect()));
  });
  useDragSubscription("drop", ({ active, activeId, droppableIds, droppables }) => {
    const collisionsIds = getCollisions(active, droppables, droppableIds);
    const layoutShift = calculateShifts(
      content,
      collisionsIds.map((id) => placeholders.find((p) => p.id === id)!),
      content.find((item) => item.id === activeId)!,
      columns
    );

    // Logs for dnd-engine debugging.
    console.log("Current grid:");
    console.log(engineToString({ items: layoutShift.current.items, width: 4 }));

    console.log("Committed grid:");
    console.log(engineToString({ items: layoutShift.committed.items, width: 4 }));

    console.log("Layout shift:");
    console.log(layoutShift);

    // Create extra transforms for "float" moves.
    if (!layoutShift.hasConflicts) {
      setTransforms(createTransforms(layoutShift.committed.items, content, active.getBoundingClientRect()));
    } else {
      setTransforms({});
    }
    setActiveDragGhost(false);
    setCollisionIds(null);

    // Commit new layout.
    if (!layoutShift.hasConflicts) {
      setTimeout(() => {
        onItemsChange(createCustomEvent({ items: exportLayout(layoutShift.committed.items, items) }));
        setTransforms({});
      }, 250);
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
