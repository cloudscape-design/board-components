// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef, useState } from "react";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { getDefaultItemSize } from "../internal/utils/layout";
import { DashboardPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});
  const [dropState, setDropState] = useState<{ id: string; isExpanded: boolean }>();

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function navigatePreviousItem(index: number) {
    if (index > 0) {
      focusItem(items[index - 1].id);
    } else {
      // TODO: add announcement
    }
  }

  function navigateNextItem(index: number) {
    if (index < items.length - 1) {
      focusItem(items[index + 1].id);
    } else {
      // TODO: add announcement
    }
  }

  function onItemNavigate(index: number, direction: Direction) {
    switch (direction) {
      case "left":
      case "up":
        return navigatePreviousItem(index);
      case "right":
      case "down":
        return navigateNextItem(index);
    }
  }

  useDragSubscription("update", ({ draggableItem, dropTarget }) =>
    setDropState({ id: draggableItem.id, isExpanded: !!dropTarget })
  );
  useDragSubscription("submit", () => setDropState(undefined));
  useDragSubscription("discard", () => setDropState(undefined));

  return (
    <div ref={paletteRef} className={styles.root}>
      <SpaceBetween size="l">
        {items.map((item, index) => (
          <ItemContainer
            ref={(elem) => {
              if (elem) {
                itemContainerRef.current[item.id] = elem;
              } else {
                delete itemContainerRef.current[item.id];
              }
            }}
            key={item.id}
            item={item}
            itemSize={getDefaultItemSize(item)}
            itemMaxSize={getDefaultItemSize(item)}
            transform={null}
            onNavigate={(direction) => onItemNavigate(index, direction)}
          >
            <div data-item-id={item.id}>
              {renderItem(item, {
                showPreview: dropState?.id === item.id && dropState.isExpanded,
              })}
            </div>
          </ItemContainer>
        ))}
      </SpaceBetween>
    </div>
  );
}
