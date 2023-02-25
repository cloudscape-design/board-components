// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from "react";
import { BoardProps } from "../../lib/components";
import { demoBoardData, demoPaletteItems } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";
import { ItemData } from "../shared/interfaces";
import { ClientAppLayout } from "./app-layout";
import { WidgetsBoard } from "./widgets-board";
import { WidgetsPalette } from "./widgets-palette";

export default function Page() {
  const [boardWidgetsLoading, setBoardWidgetsLoading] = useState(false);
  const [boardWidgets, setBoardWidgets] = useState(demoBoardData);

  const [paletteWidgetsLoading, setPaletteWidgetsLoading] = useState(false);
  const [paletteWidgets, setPaletteWidgets] = useState(demoPaletteItems);

  useEffect(() => {
    if (boardWidgetsLoading) {
      setBoardWidgets({ items: [], layout: {} });

      const timeoutId = setTimeout(() => {
        setBoardWidgetsLoading(false);
        setBoardWidgets(demoBoardData);
      }, 5 * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [boardWidgetsLoading]);

  useEffect(() => {
    if (paletteWidgetsLoading) {
      setPaletteWidgets([]);

      const timeoutId = setTimeout(() => {
        setPaletteWidgetsLoading(false);
        setPaletteWidgets(demoPaletteItems);
      }, 10 * 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [paletteWidgetsLoading]);

  const onChange = ({ items, layout, addedItem, removedItem }: BoardProps.ItemsChangeDetail<ItemData>) => {
    setBoardWidgets({ items, layout });
    if (addedItem) {
      setPaletteWidgets((paletteWidgets) => paletteWidgets.filter((item) => item.id !== addedItem.id));
    }
    if (removedItem) {
      setPaletteWidgets((prev) => [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title)));
    }
  };

  const onReload = () => {
    setBoardWidgetsLoading(true);
    setPaletteWidgetsLoading(true);
  };

  return (
    <ScreenshotArea>
      <ClientAppLayout
        content={<WidgetsBoard loading={boardWidgetsLoading} widgets={boardWidgets} onWidgetsChange={onChange} />}
        splitPanelContent={<WidgetsPalette loading={paletteWidgetsLoading} widgets={paletteWidgets} />}
        onReload={onReload}
      />
    </ScreenshotArea>
  );
}
