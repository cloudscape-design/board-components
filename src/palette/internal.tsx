// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import SpaceBetween from "@cloudscape-design/components/space-between";
import { DndContext } from "@dnd-kit/core";
import { ItemContextProvider } from "../internal/item-context";
import { DashboardPaletteProps } from "./interfaces";

export default function DashboardPalette<D>({ items, renderItem }: DashboardPaletteProps<D>) {
  return (
    <DndContext>
      <SpaceBetween size="l">
        {items.map((item) => (
          <ItemContextProvider key={item.id} value={{ id: item.id, transform: null, resizable: false }}>
            {renderItem(item)}
          </ItemContextProvider>
        ))}
      </SpaceBetween>
    </DndContext>
  );
}
