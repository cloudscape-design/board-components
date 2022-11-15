// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { DndContext, DragEndEvent, DragMoveEvent, DragOverlay, DragStartEvent, UniqueIdentifier } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import Grid from "../internal/grid";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";

import { irregularRectIntersection } from "./calculations/collision";
import { createLayout } from "./calculations/create-layout";
import { exportLayout } from "./calculations/export-layout";
import { calculateShifts, createTransforms } from "./calculations/reorder";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

export default function DashboardLayout<D>({ items, renderItem, onItemsChange, ...rest }: DashboardLayoutProps<D>) {
  const bubbleUp = (rest as any).bubbleUp;
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const [transforms, setTransforms] = useState<Record<string, Transform>>({});
  const [collisionIds, setCollisionIds] = useState<null | Array<UniqueIdentifier>>(null);
  const [activeDragGhost, setActiveDragGhost] = useState<string | null>(null);

  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;
  const { content, placeholders, rows } = createLayout(items, columns, !!activeDragGhost);

  // There is an issue in dnd-kit where onDragMove can be fired after onDragEnd
  const dragInProgressRef = useRef(false);

  function parseDragEvent(event: DragMoveEvent | DragEndEvent) {
    return {
      collisions: event.collisions!.map((collision) => placeholders.find((p) => p.id === collision.id)!),
      active: content.find((item) => item.id === event.active.id)!,
    };
  }

  function handleDragStart(event: DragStartEvent) {
    const dragContainer: HTMLElement = event.active.data.current!.elementRef.current;
    const dragContainerRect = dragContainer.getBoundingClientRect();
    const containerCopy = dragContainer.cloneNode(true) as HTMLElement;
    containerCopy.style.width = dragContainerRect.width + `px`;
    containerCopy.style.height = dragContainerRect.height + `px`;
    setActiveDragGhost(containerCopy.outerHTML);
    dragInProgressRef.current = true;
  }

  function handleDragMove(event: DragMoveEvent) {
    if (!dragInProgressRef.current) {
      return;
    }
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
    setActiveDragGhost(null);
    setTransforms({});
    setCollisionIds(null);
    dragInProgressRef.current = false;
  }
  return (
    <DndContext
      modifiers={[restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      collisionDetection={irregularRectIntersection(bubbleUp)}
    >
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

      <DragOverlay>
        {activeDragGhost && (
          // eslint-disable-next-line react/no-danger
          <div dangerouslySetInnerHTML={{ __html: activeDragGhost }}></div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
