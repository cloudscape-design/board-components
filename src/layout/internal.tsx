// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import { DndEngine } from "../internal/dnd-engine/engine";
import Grid from "../internal/grid";
import { DashboardItemBase, GridLayoutItem, ItemId, Position, Rect } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import { appendPath, createTransforms, printLayoutDebug } from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

interface TransitionState {
  transforms: { [itemId: ItemId]: Transform };
  collisionIds: ItemId[];
  item: DashboardItemBase<unknown>;
  layoutItem: null | GridLayoutItem;
  path: Position[];
  rows: number;
}

export default function DashboardLayout<D>({ items, renderItem, onItemsChange }: DashboardLayoutProps<D>) {
  const [containerSize, containerQueryRef] = useContainerQuery(
    (entry) => (entry.contentBoxWidth < BREAKPOINT_SMALL ? "small" : "full"),
    []
  );
  const columns = containerSize === "small" ? COLUMNS_SMALL : COLUMNS_FULL;

  const [transition, setTransition] = useState<null | TransitionState>(null);

  const itemsLayout = createItemsLayout(items, columns);
  const layoutItemById = new Map(itemsLayout.items.map((item) => [item.id, item]));
  const rows = transition?.rows ?? itemsLayout.rows;
  const placeholdersLayout = createPlaceholdersLayout(rows, columns);

  function getLayoutShift(resize: boolean, collisionRect: Rect, path: Position[]) {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    if (resize) {
      return new DndEngine(itemsLayout).resize({
        itemId: transition.item.id,
        height: collisionRect.bottom - collisionRect.top,
        width: collisionRect.right - collisionRect.left,
      });
    }

    if (!transition.layoutItem) {
      const width = transition.item.definition.defaultColumnSpan;
      const height = transition.item.definition.defaultRowSpan;
      const x = Math.min(itemsLayout.columns - width, collisionRect.left);
      const y = collisionRect.top;
      const layoutItem = { id: transition.item.id, x, y, width, height };
      return new DndEngine(itemsLayout).insert(layoutItem);
    }

    return new DndEngine(itemsLayout).move({ itemId: transition.item.id, path: path.slice(1) });
  }

  useDragSubscription("start", (detail) => {
    const item = detail.item;
    const layoutItem = layoutItemById.get(detail.item.id) ?? null;

    // Define starting path for reorder.
    const path = layoutItem && !detail.resize ? [{ x: layoutItem.x, y: layoutItem.y }] : [];

    // Override rows to plan for possible height increase.
    const itemHeight = layoutItem ? layoutItem.height : item.definition.defaultRowSpan;
    const rows = detail.resize ? itemsLayout.rows : itemsLayout.rows + itemHeight;

    setTransition({ transforms: {}, collisionIds: [], item, layoutItem, path, rows });
  });

  useDragSubscription("move", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const path = transition.path.length > 0 ? appendPath(transition.path, collisionRect) : [];
    const layoutShift = getLayoutShift(detail.resize, collisionRect, path);

    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    const transforms = createTransforms(itemsLayout, layoutShift.moves, cellRect);

    const itemHeight = transition?.layoutItem
      ? transition.layoutItem.height
      : transition.item.definition.defaultRowSpan;
    const rows = layoutShift.next.rows + itemHeight;

    setTransition({ ...transition, collisionIds, transforms, path, rows });
  });

  useDragSubscription("drop", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const path = transition.path.length > 0 ? appendPath(transition.path, collisionRect) : [];
    const layoutShift = getLayoutShift(detail.resize, collisionRect, path);

    printLayoutDebug(itemsLayout, layoutShift);

    setTransition(null);

    // Commit new layout for insert case.
    if (layoutShift.conflicts.length === 0 && !transition.layoutItem) {
      // TODO: resolve "any" here.
      // It is not quite clear yet how to ensure the addedItem matches generic D type.
      const newLayout = exportItemsLayout(layoutShift.next, [...items, transition.item] as any);
      const addedItem = newLayout.find((item) => item.id === transition.item.id)!;
      onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
    }
    // Commit new layout for reorder/resize case.
    else if (layoutShift.conflicts.length === 0) {
      onItemsChange(createCustomEvent({ items: exportItemsLayout(layoutShift.next, items) }));
    }
  });

  return (
    <div ref={containerQueryRef as Ref<HTMLDivElement>}>
      <Grid columns={columns} rows={rows} layout={[...placeholdersLayout.items, ...itemsLayout.items]}>
        {placeholdersLayout.items.map((placeholder) => (
          <Placeholder
            key={placeholder.id}
            id={placeholder.id}
            state={
              transition?.item ? (transition.collisionIds?.includes(placeholder.id) ? "hover" : "active") : "default"
            }
          />
        ))}
        {items.map((item) => (
          <ItemContextProvider
            key={item.id}
            value={{
              item,
              itemSize: layoutItemById.get(item.id) ?? {
                width: item.definition.defaultColumnSpan,
                height: item.definition.defaultRowSpan,
              },
              resizable: true,
              transform: transition?.transforms[item.id] ?? null,
            }}
          >
            {renderItem(item)}
          </ItemContextProvider>
        ))}
      </Grid>
    </div>
  );
}
