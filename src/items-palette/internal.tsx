// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef, useState } from "react";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import { ScreenReaderGridNavigation } from "../internal/screenreader-grid-navigation";
import { getDefaultItemSize } from "../internal/utils/layout";
import { ItemsPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export function InternalItemsPalette<D>({
  items,
  renderItem,
  i18nStrings,
  __internalRootRef,
}: ItemsPaletteProps<D> & InternalBaseComponentProps) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});
  const [dropState, setDropState] = useState<{ id: string; isExpanded: boolean }>();
  const [announcement, setAnnouncement] = useState("");

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  useDragSubscription("start", ({ draggableItem: { id } }) => {
    setDropState({ id, isExpanded: false });

    // Announce only if the target item belongs to the palette.
    if (items.some((it) => it.id === id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDndStarted);
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
      setAnnouncement(i18nStrings.liveAnnouncementDndDiscarded);
    }
  });

  useDragSubscription("discard", () => {
    setDropState(undefined);

    // Announce only if the target item belongs to the palette.
    if (items.some((it) => it.id === dropState?.id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDndDiscarded);
    }
  });

  useDragSubscription("acquire", ({ draggableItem }) => {
    // "Disconnect" target item from the palette if borrowed.
    if (items.some((it) => it.id === draggableItem.id)) {
      setDropState(undefined);
    }
  });

  const itemsLayout = {
    items: items.map((it, index) => ({ id: it.id, x: 0, y: index, width: 1, height: 1 })),
    columns: 1,
    rows: items.length,
  };

  return (
    <div ref={__internalRootRef}>
      <ScreenReaderGridNavigation
        items={items}
        itemsLayout={itemsLayout}
        ariaLabel={i18nStrings.navigationAriaLabel}
        ariaDescription={i18nStrings.navigationAriaDescription}
        itemAriaLabel={(item) => i18nStrings.navigationItemAriaLabel(item!)}
        onActivateItem={focusItem}
      />

      <div ref={paletteRef} className={styles.root}>
        <SpaceBetween size="l">
          {items.map((item) => (
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
              acquired={false}
              transform={undefined}
              inTransition={false}
              itemSize={getDefaultItemSize(item)}
              itemMaxSize={getDefaultItemSize(item)}
            >
              {renderItem(item, {
                showPreview: dropState?.id === item.id && dropState.isExpanded,
              })}
            </ItemContainer>
          ))}
        </SpaceBetween>
      </div>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
