// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { MIN_ROW_SPAN } from "../internal/constants";
import { ItemContextProvider } from "../internal/item-context";
import { DashboardPaletteProps } from "./interfaces";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  return (
    <SpaceBetween size="l">
      {items.map((item) => (
        <ItemContextProvider
          key={item.id}
          value={{
            item,
            itemSize: {
              width: item.definition.defaultColumnSpan,
              height: Math.max(MIN_ROW_SPAN, item.definition.defaultRowSpan),
            },
            transform: null,
            resizable: false,
          }}
        >
          {renderItem(item)}
        </ItemContextProvider>
      ))}
    </SpaceBetween>
  );
}
