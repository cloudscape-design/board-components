// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef, useState } from "react";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { Direction, ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import { getDefaultItemSize } from "../internal/utils/layout";
import { ItemsPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export default function ItemsPalette<D>({ items, renderItem, i18nStrings }: ItemsPaletteProps<D>) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});
  const [dropState, setDropState] = useState<{ id: string; isExpanded: boolean }>();
  const [announcement, setAnnouncement] = useState("");

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  function navigatePreviousItem(index: number) {
    const item = items[index - 1];

    if (item) {
      focusItem(item.id);
    }
    setAnnouncement("");
  }

  function navigateNextItem(index: number) {
    const item = items[index + 1];

    if (item) {
      focusItem(item.id);
    }
    setAnnouncement("");
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

  useDragSubscription("start", ({ draggableItem: { id } }) => {
    setDropState({ id, isExpanded: false });

    // Announce only if the target item belongs to the palette.
    if (items.some((it) => it.id === id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDragStarted);
    } else {
      setAnnouncement("");
    }
  });
  useDragSubscription("update", ({ draggableItem: { id }, dropTarget }) => {
    setDropState({ id, isExpanded: !!dropTarget });
  });
  useDragSubscription("submit", () => {
    setDropState(undefined);

    // Announce only if the target item belongs to the palette.
    if (dropState && items.some((it) => it.id === dropState.id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDragDiscarded);
    }
  });
  useDragSubscription("discard", () => {
    setDropState(undefined);

    // Announce only if the target item belongs to the palette.
    if (items.some((it) => it.id === dropState?.id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDragDiscarded);
    }
  });

  // "Disconnect" target item from the palette if borrowed.
  const onBorrow = () => {
    setDropState(undefined);
  };

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
            onNavigate={(direction) => onItemNavigate(index, direction)}
            onBorrow={onBorrow}
            dragHandleAriaLabel={i18nStrings.itemDragHandleAriaLabel(item, index, items)}
            dragHandleAriaDescription={i18nStrings.itemDragHandleAriaDescription}
            resizeHandleAriaLabel=""
            resizeHandleAriaDescription=""
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
