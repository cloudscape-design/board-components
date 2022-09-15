// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Box from "@cloudscape-design/components/box";
import * as awsuiTokens from "@cloudscape-design/design-tokens";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS as CSSUtil } from "@dnd-kit/utilities";
import css from "./styles.module.css";
import { createGridStrategy, getPosition } from "./strats";
import clsx from "clsx";
import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core/dist/types";
import chunk from "lodash/chunk";

const columnsCount = 3;
const initialItems = [
  { id: 1, color: awsuiTokens.colorChartsPaletteCategorical1 },
  { id: 2, color: awsuiTokens.colorChartsPaletteCategorical2 },
  { id: 3, color: awsuiTokens.colorChartsPaletteCategorical3 },
  { id: 4, color: awsuiTokens.colorChartsPaletteCategorical4 },
  { id: 5, color: awsuiTokens.colorChartsPaletteCategorical5 },
  { id: 6, color: awsuiTokens.colorChartsPaletteCategorical6 },
  { id: 7, color: awsuiTokens.colorChartsPaletteCategorical7 },
  { id: 8, color: awsuiTokens.colorChartsPaletteCategorical8 },
  { id: 9, color: awsuiTokens.colorChartsPaletteCategorical9 },
  { id: 10, color: awsuiTokens.colorChartsPaletteCategorical10 },
  { id: 11, color: awsuiTokens.colorChartsPaletteCategorical11 },
  { id: 12, color: awsuiTokens.colorChartsPaletteCategorical12 },
  { id: 13, color: awsuiTokens.colorChartsPaletteCategorical13 },
  { id: 14, color: awsuiTokens.colorChartsPaletteCategorical14 },
  { id: 15, color: awsuiTokens.colorChartsPaletteCategorical15 },
];

function SortableItem({ item }: { item: typeof initialItems[0] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, active } = useSortable({ id: item.id });

  const style = {
    transform: CSSUtil.Transform.toString(transform),
    transition: active ? transition : undefined,
    backgroundColor: item.color,
  };

  return (
    <div
      ref={setNodeRef}
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

  function handleReorder(event: DragEndEvent) {
    const from = event.active;
    const to = event.over;
    if (!to) {
      return;
    }
    const newItems = items.slice();
    const chunked = chunk(items, columnsCount);
    const fromPosition = getPosition(
      chunked,
      newItems.find((i) => i.id === from.id)
    );
    const toPosition = getPosition(
      chunked,
      newItems.find((i) => i.id === to.id)
    );
    const xDirection = Math.sign(toPosition.x - fromPosition.x);
    for (let x = fromPosition.x; x !== toPosition.x; x += xDirection) {
      const offset = fromPosition.y * columnsCount + x;
      const temp = newItems[offset];
      newItems[offset] = newItems[offset + xDirection];
      newItems[offset + xDirection] = temp;
    }
    const yDirection = Math.sign(toPosition.y - fromPosition.y);
    for (let y = fromPosition.y; y !== toPosition.y; y += yDirection) {
      const absFrom = y * columnsCount + toPosition.x;
      const absTo = (y + yDirection) * columnsCount + toPosition.x;
      const temp = newItems[absFrom];
      newItems[absFrom] = newItems[absTo];
      newItems[absTo] = temp;
    }
    setItems(newItems);
  }

  return (
    <Box>
      <DndContext onDragEnd={handleReorder}>
        <div className={css.grid} style={{ "--columns-count": columnsCount } as any}>
          <SortableContext items={items} strategy={createGridStrategy(columnsCount)}>
            {items.map((item) => (
              <SortableItem key={item.id} item={item} />
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </Box>
  );
}
