// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { DndContext, DragEndEvent, DragMoveEvent, UniqueIdentifier } from "@dnd-kit/core";
import { Ref, useState } from "react";
import type { DataFallbackType } from "../internal/base-types";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import Grid from "../internal/grid";
import { ItemContext, ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";

import { irregularRectIntersection } from "./calculations/collision";
import { createLayout } from "./calculations/create-layout";
import { exportLayout } from "./calculations/export-layout";
import { calculateShifts, createTransforms } from "./calculations/reorder";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

export default function DashboardLayout<D = DataFallbackType>({
  items,
  renderItem,
  onItemsChange,
}: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const [transforms, setTransforms] = useState<Array<ItemContext> | null>(null);
  const [collisionIds, setCollisionIds] = useState<null | Array<UniqueIdentifier>>(null);
  const [isDragging, setIsDragging] = useState(false);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createLayout(items, columns, isDragging);

  function parseDragEvent(event: DragMoveEvent | DragEndEvent) {
    return {
      collisions: event.collisions!.map((collision) => placeholders.find((p) => p.id === collision.id)!),
      active: content.find((item) => item.id === event.active.id)!,
    };
  }

  function handleDragStart() {
    setIsDragging(true);
  }

  function handleDragMove(event: DragMoveEvent) {
    const { collisions, active } = parseDragEvent(event);
    setCollisionIds(collisions.map((collision) => collision.id));
    const nextGrid = calculateShifts(content, collisions, active);
    setTransforms(createTransforms(nextGrid, content, event.active.rect.current.initial!));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { collisions, active } = parseDragEvent(event);
    const nextGrid = calculateShifts(content, collisions, active);
    if (nextGrid) {
      onItemsChange(createCustomEvent({ items: exportLayout(nextGrid, items) }));
    }
    setIsDragging(false);
    setTransforms(null);
    setCollisionIds(null);
  }
  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      collisionDetection={irregularRectIntersection}
    >
      <div ref={containerQueryRef as Ref<HTMLDivElement>}>
        <Grid columns={columns} rows={rows} layout={[...placeholders, ...content]}>
          {placeholders.map((placeholder) => (
            <Placeholder
              key={placeholder.id}
              id={placeholder.id}
              state={isDragging ? (collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"}
            />
          ))}
          {items.map((item) => {
            return (
              <ItemContextProvider
                key={item.id}
                value={transforms?.find((t) => t.id === item.id) ?? { id: item.id, transform: null }}
              >
                {renderItem(item)}
              </ItemContextProvider>
            );
          })}
        </Grid>
      </div>
    </DndContext>
  );
}
