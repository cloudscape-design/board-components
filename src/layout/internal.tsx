// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContainerQuery } from "@cloudscape-design/component-toolkit";
import { Transform } from "@dnd-kit/utilities";
import { Ref, useRef, useState } from "react";
import { BREAKPOINT_SMALL, COLUMNS_FULL, COLUMNS_SMALL } from "../internal/constants";
import { useDragSubscription } from "../internal/dnd-controller";
import Grid from "../internal/grid";
import { DashboardItemBase, GridLayoutItem, ItemId, Position, Rect } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { createCustomEvent } from "../internal/utils/events";
import { createItemsLayout, createPlaceholdersLayout, exportItemsLayout } from "../internal/utils/layout";
import { getHoveredDroppables, getHoveredRect } from "./calculations/collision";
import {
  calculateInsertShifts,
  calculateReorderShifts,
  calculateResizeShifts,
  createTransforms,
  printLayoutDebug,
} from "./calculations/shift-layout";

import { DashboardLayoutProps } from "./interfaces";
import Placeholder from "./placeholder";

interface TransitionState {
  transforms: { [itemId: ItemId]: Transform };
  collisionIds: ItemId[];
  item: DashboardItemBase<unknown>;
  layoutItem: null | GridLayoutItem;
  rows: number;
}

export default function DashboardLayout<D>({ items, renderItem, onItemsChange }: DashboardLayoutProps<D>) {
  const pathRef = useRef<Position[]>([]);

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

  function getLayoutShift(resize: boolean, collisionRect: Rect) {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    if (resize) {
      return calculateResizeShifts(itemsLayout, collisionRect, transition.item.id);
    }
    return transition.layoutItem
      ? calculateReorderShifts(itemsLayout, collisionRect, transition.item.id, pathRef.current)
      : calculateInsertShifts(itemsLayout, collisionRect, transition.item);
  }

  useDragSubscription("start", (detail) => {
    const item = detail.item;
    const layoutItem = layoutItemById.get(detail.item.id) ?? null;

    // Init move path for reorder.
    if (layoutItem && !detail.resize) {
      pathRef.current = [{ x: layoutItem.x, y: layoutItem.y }];
    }

    // Override rows to plan for possible height increase.
    const itemHeight = layoutItem ? layoutItem.height : item.definition.defaultRowSpan;
    const rows = detail.resize ? itemsLayout.rows : itemsLayout.rows + itemHeight;

    setTransition({ transforms: {}, collisionIds: [], item, layoutItem, rows });
  });

  useDragSubscription("move", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const collisionIds = getHoveredDroppables(detail);
    const collisionRect = getHoveredRect(collisionIds, placeholdersLayout.items);
    const layoutShift = getLayoutShift(detail.resize, collisionRect);

    pathRef.current = layoutShift.path;

    const cellRect = detail.droppables[0][1].getBoundingClientRect();
    const transforms = createTransforms(itemsLayout, layoutShift.moves, cellRect);

    const itemHeight = transition?.layoutItem
      ? transition.layoutItem.height
      : transition.item.definition.defaultRowSpan;
    const rows = layoutShift.next.rows + itemHeight;

    setTransition({ ...transition, collisionIds, transforms, rows });
  });

  useDragSubscription("drop", (detail) => {
    if (!transition) {
      throw new Error("Invariant violation: no transition.");
    }

    const collisionRect = getHoveredRect(getHoveredDroppables(detail), placeholdersLayout.items);
    const layoutShift = getLayoutShift(detail.resize, collisionRect);

    printLayoutDebug(itemsLayout, layoutShift);

    pathRef.current = [];
    setTransition(null);

    // Commit new layout for insert case.
    if (!layoutShift.hasConflicts && !transition.layoutItem) {
      // TODO: resolve "any" here.
      // It is not quite clear yet how to ensure the addedItem matches generic D type.
      const newLayout = exportItemsLayout(layoutShift.next, [...items, transition.item] as any);
      const addedItem = newLayout.find((item) => item.id === transition.item.id)!;
      onItemsChange(createCustomEvent({ items: newLayout, addedItem } as any));
    }
    // Commit new layout for reorder/resize case.
    else if (!layoutShift.hasConflicts) {
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
