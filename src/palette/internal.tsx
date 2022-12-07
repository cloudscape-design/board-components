// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRef } from "react";
import handleStyles from "../internal/handle/styles.css.js";
import { Direction } from "../internal/interfaces";
import { ItemContextProvider } from "../internal/item-context";
import { DashboardPaletteProps } from "./interfaces";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  const paletteRef = useRef<HTMLDivElement>(null);

  function focusItem(index: number) {
    const itemId = items[index].id;
    const handleSelector = `[data-item-id="${itemId}"] .${handleStyles.handle}`;
    const handle = paletteRef.current!.querySelector(handleSelector) as null | HTMLButtonElement;
    handle?.focus();
  }

  function navigatePreviousItem(index: number) {
    if (index > 0) {
      focusItem(index - 1);
    } else {
      // TODO: add announcement
    }
  }

  function navigateNextItem(index: number) {
    if (index < items.length - 1) {
      focusItem(index + 1);
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
    <div ref={paletteRef}>
      <SpaceBetween size="l">
        {items.map((item, index) => (
          <ItemContextProvider
            key={item.id}
            value={{
              item,
              itemSize: { width: item.definition.defaultColumnSpan, height: item.definition.defaultRowSpan },
              itemMaxSize: { width: item.definition.defaultColumnSpan, height: item.definition.defaultRowSpan },
              transform: null,
              onNavigate: (direction) => onItemNavigate(index, direction),
            }}
          >
            <div data-item-id={item.id}>{renderItem(item)}</div>
          </ItemContextProvider>
        ))}
      </SpaceBetween>
    </div>
  );
}
