// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from "react";
import { demoLayoutItems, demoPaletteItems } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";
import { ClientAppLayout } from "./app-layout";
import { WidgetsBoard } from "./widgets-board";
import { WidgetsPalette } from "./widgets-palette";

export default function Page() {
  const [layoutWidgets, setLayoutWidgets] = useState(demoLayoutItems);
  const [paletteWidgets, setPaletteWidgets] = useState(demoPaletteItems);
  return (
    <ScreenshotArea>
      <ClientAppLayout
        content={
          <WidgetsBoard
            widgets={layoutWidgets}
            onWidgetsChange={({ items, addedItem, removedItem }) => {
              setLayoutWidgets(items);
              if (addedItem) {
                setPaletteWidgets((paletteWidgets) => paletteWidgets.filter((item) => item.id !== addedItem.id));
              }
              if (removedItem) {
                setPaletteWidgets((prev) =>
                  [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title))
                );
              }
            }}
          />
        }
        splitPanelContent={<WidgetsPalette widgets={paletteWidgets} />}
      />
    </ScreenshotArea>
  );
}
