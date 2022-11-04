// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CollisionDescriptor, DndContext, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useState } from "react";
import type { DataFallbackType } from "../internal/base-types";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import Grid from "../internal/grid";
import { canvasItemsToLayout, layoutToCanvasItems } from "../internal/layout";
import useContainerQuery from "../internal/use-container-query";
import { createCustomEvent } from "../internal/utils/events";
import { irregularRectIntersection } from "./collision";
import createGridLayout from "./create-grid-layout";
import { DashboardLayoutProps } from "./interfaces";
import { calculateShifts, createTransforms } from "./layout";
import Placeholder from "./placeholder";
import { SortableItem } from "./sortable-item";

const columnsCount = 4;

export default function DashboardLayout<D = DataFallbackType>({
  items,
  renderItem,
  onItemsChange,
}: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createGridLayout({ items, columns });

  const [transforms, setTransforms] = useState<Array<{ id: string; transform: Transform }> | null>(null);

  function handleDragMove(event: DragMoveEvent) {
    const sourceGrid = canvasItemsToLayout(items, columnsCount);
    const nextGrid = calculateShifts(
      sourceGrid,
      event.collisions as Array<CollisionDescriptor>,
      event.active,
      event.over
    );
    setTransforms(createTransforms(nextGrid, sourceGrid, event.active.rect.current.initial!));
  }

  function handleDragEnd(event: DragEndEvent) {
    setTransforms(null);
    const nextGrid = calculateShifts(
      canvasItemsToLayout(items, columnsCount),
      event.collisions as Array<CollisionDescriptor>,
      event.active,
      event.over
    );
    if (nextGrid) {
      onItemsChange(createCustomEvent({ items: layoutToCanvasItems(nextGrid, items) }));
    }
  }
  return (
    <DndContext onDragMove={handleDragMove} onDragEnd={handleDragEnd} collisionDetection={irregularRectIntersection}>
      <div ref={containerQueryRef as Ref<HTMLDivElement>}>
        <Grid columns={columns} rows={rows} layout={[...placeholders, ...content]}>
          {placeholders.map(({ id }) => (
            <Placeholder key={id} state="default" />
          ))}
          {items.map((item) => {
            return (
              <SortableItem
                key={item.id}
                id={item.id}
                renderItem={(ctx) => renderItem(item, ctx)}
                animate={transforms !== null}
                transform={transforms?.find((t) => t.id === item.id)?.transform ?? null}
              />
            );
          })}
        </Grid>
      </div>
    </DndContext>
  );
}
