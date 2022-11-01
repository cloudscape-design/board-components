// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Box from "@cloudscape-design/components/box";
import { CollisionDescriptor, DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Transform, useCombinedRefs, CSS as CSSUtil } from "@dnd-kit/utilities";
import css from "./styles.module.css";
import clsx from "clsx";
import { CSSProperties, useState } from "react";
import { calculateShifts, createTransforms } from "./layout";
import { initialItems, Item } from "./items";
import { Canvas } from "../../lib/components";
import { canvasItemsToLayout, layoutToCanvasItems } from "../../lib/components/internal/layout";

const columnsCount = 4;

interface SortableItemProps {
  item: Item;
  transform: Transform | null;
  animate: boolean;
}

function SortableItem({ item, transform }: SortableItemProps) {
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
    transform: dragTransform,
    active,
  } = useDraggable({ id: item.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: item.id });

  const style: CSSProperties = {
    transform: CSSUtil.Translate.toString(dragTransform ?? transform),
    backgroundColor: item.data.color,
    transition:
      !dragTransform && active
        ? CSSUtil.Transition.toString({ property: "transform", duration: 200, easing: "ease" })
        : undefined,
    gridColumnEnd: item.columnSpan ? `span ${item.columnSpan}` : undefined,
  };

  return (
    <div
      ref={useCombinedRefs(setDragRef, setDropRef)}
      className={clsx(css.item, isDragging && css.itemDragging)}
      style={style}
      {...attributes}
      {...listeners}
    >
      {item.id}
    </div>
  );
}

export default function () {
  const [items, setItems] = useState(initialItems);
  const [transforms, setTransforms] = useState<Array<{ id: string; transform: Transform }> | null>(null);

  function handleReorder(event: DragEndEvent) {
    setTransforms(null);
    const nextGrid = calculateShifts(
      canvasItemsToLayout(items, columnsCount),
      event.collisions as Array<CollisionDescriptor>,
      event.active,
      event.over
    );
    if (nextGrid) {
      setItems(layoutToCanvasItems(nextGrid, items));
    }
  }

  return (
    <main>
      <Box>
        <DndContext
          onDragEnd={handleReorder}
          onDragMove={(event) => {
            const sourceGrid = canvasItemsToLayout(items, columnsCount);
            const nextGrid = calculateShifts(
              sourceGrid,
              event.collisions as Array<CollisionDescriptor>,
              event.active,
              event.over
            );
            setTransforms(createTransforms(nextGrid, sourceGrid, event.active.rect.current.initial!));
          }}
        >
          <Canvas
            items={items}
            renderItem={(item) => (
              <SortableItem
                key={item.id}
                item={item}
                animate={transforms !== null}
                transform={transforms?.find((t) => t.id === item.id)?.transform ?? null}
              />
            )}
          />
        </DndContext>
      </Box>
    </main>
  );
}
