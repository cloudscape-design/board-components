// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Ref, useState } from "react";
import Grid from "../internal/grid";
import type { DataFallbackType } from "../interfaces";
import { CanvasProps } from "./interfaces";
import Placeholder from "./placeholder";
import useGridLayout from "./use-grid-layout";
import useContainerQuery from "../internal/use-container-query/index";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../constants";
import { canvasItemsToLayout, layoutToCanvasItems } from "../internal/layout";
import { CollisionDescriptor, DndContext, DragEndEvent, DragMoveEvent } from "@dnd-kit/core";
import { Transform } from "@dnd-kit/utilities";
import { SortableItem } from "./sortable-item";
import { createCustomEvent } from "../internal/utils/events";
import { calculateShifts, createTransforms } from "./layout";

const columnsCount = 4;

export default function Canvas<D = DataFallbackType>({ items, renderItem, onItemsChange }: CanvasProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = useGridLayout({ items, columns });

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
    <DndContext onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
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
