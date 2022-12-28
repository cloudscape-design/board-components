// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef, useState } from "react";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import { getDefaultItemSize } from "../internal/utils/layout";
import { DashboardPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});
  const [dragActive, setDragActive] = useState(false);
  const [dropState, setDropState] = useState<{ id: string; isExpanded: boolean }>();
  const [announcement, setAnnouncement] = useState("");

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function navigatePreviousItem(index: number) {
    const item = items[index - 1];

    if (item) {
      focusItem(item.id);
      setAnnouncement("");
    } else {
      // TODO: use i18n-strings
      setAnnouncement("No previous item");
    }
  }

  function navigateNextItem(index: number) {
    const item = items[index + 1];

    if (item) {
      focusItem(item.id);
      setAnnouncement("");
    } else {
      // TODO: use i18n-strings
      setAnnouncement("No next item");
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

  useDragSubscription("start", () => setDragActive(true));
  useDragSubscription("update", ({ draggableItem, dropTarget }) =>
    setDropState({ id: draggableItem.id, isExpanded: !!dropTarget })
  );
  useDragSubscription("submit", () => {
    setDragActive(false);
    setDropState(undefined);
  });
  useDragSubscription("discard", () => {
    setDragActive(false);
    setDropState(undefined);
  });

  // TODO: use i18n-strings
  const dragInteractionDescription = !dragActive
    ? `Use Space or Enter to enter insert mode`
    : `To move the item use arrow keys. Press Space or Enter to submit or Esc to discard`;

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
            dragInteractionDescription={dragInteractionDescription}
          >
            <div data-item-id={item.id}>
              {renderItem(item, {
                showPreview: dropState?.id === item.id && dropState.isExpanded,
              })}
            </div>
          </ItemContainer>
        ))}
      </SpaceBetween>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
