// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef } from "react";
import { MIN_ROW_SPAN } from "../internal/constants";
import { Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import { DashboardPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});

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

  return (
    <div ref={paletteRef} className={styles.root}>
      <SpaceBetween size="l">
        {items.map((item, index) => {
          const itemSize = {
            width: Math.max(item.definition.defaultColumnSpan, item.definition.minColumnSpan ?? 1),
            height: Math.max(item.definition.defaultRowSpan, item.definition.minRowSpan ?? 1, MIN_ROW_SPAN),
          };
          return (
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
              itemSize={itemSize}
              itemMaxSize={itemSize}
              transform={null}
              onNavigate={(direction) => onItemNavigate(index, direction)}
            >
              <div data-item-id={item.id}>{renderItem(item)}</div>
            </ItemContainer>
          );
        })}
      </SpaceBetween>
    </div>
  );
}
