// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { getIsRtl } from "@cloudscape-design/component-toolkit/internal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef, useState } from "react";
import { getDataAttributes } from "../internal/base-component/get-data-attributes";
import { InternalBaseComponentProps } from "../internal/base-component/use-base-component";
import { useDragSubscription } from "../internal/dnd-controller/controller";
import { ItemId } from "../internal/interfaces";
import { ItemContainer, ItemContainerRef } from "../internal/item-container";
import LiveRegion from "../internal/live-region";
import { ScreenReaderGridNavigation } from "../internal/screenreader-grid-navigation";
import { ItemsPaletteProps } from "./interfaces";
import styles from "./styles.css.js";

export function InternalItemsPalette<D>({
  items,
  renderItem,
  i18nStrings,
  __internalRootRef,
  ...rest
}: ItemsPaletteProps<D> & InternalBaseComponentProps) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const itemContainerRef = useRef<{ [id: ItemId]: ItemContainerRef }>({});
  const [dropState, setDropState] = useState<{ id: string }>();
  const [announcement, setAnnouncement] = useState("");

  const isRtl = () => getIsRtl(paletteRef.current);

  function focusItem(itemId: ItemId) {
    itemContainerRef.current[itemId].focusDragHandle();
  }

  useDragSubscription("start", ({ draggableItem: { id } }) => {
    setDropState({ id });

    // Announce only if the target item belongs to the palette.
    if (items.some((it) => it.id === id)) {
      setAnnouncement(i18nStrings.liveAnnouncementDndStarted);
    } else {
      setAnnouncement("");
    }
  });

  useDragSubscription("update", ({ draggableItem: { id } }) => {
    setDropState({ id });
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
    <div ref={__internalRootRef} {...getDataAttributes(rest)}>
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
              placed={false}
              acquired={false}
              transform={undefined}
              inTransition={false}
              getItemSize={(dropContext) => {
                if (!dropContext) {
                  throw new Error("Invariant violation: cannot query palette item size with no drop context.");
                }
                const { width, height } = dropContext.scale(item);
                return { width, minWidth: width, maxWidth: width, height, minHeight: height, maxHeight: height };
              }}
              isRtl={isRtl}
            >
              {(hasDropTarget) => renderItem(item, { showPreview: hasDropTarget })}
            </ItemContainer>
          ))}
        </SpaceBetween>
      </div>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
}
