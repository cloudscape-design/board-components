// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { Board, BoardItem, BoardProps, ItemsPalette } from "../../lib/components";
import { ItemsPaletteProps } from "../../src/items-palette/interfaces";
import PageLayout from "../app/page-layout";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { demoWidgets } from "./items";

import classnames from "./engine.module.css";

function boardI18nStringsWithName(boardLabel: string): BoardProps.I18nStrings<ItemData> {
  return {
    ...boardI18nStrings,
    liveAnnouncementDndItemInserted: (op) => `${boardLabel}: ${boardI18nStrings.liveAnnouncementDndItemInserted(op)}`,
    liveAnnouncementDndCommitted: (op) => `${boardLabel}: ${boardI18nStrings.liveAnnouncementDndCommitted(op)}`,
  };
}

function DemoBoard({
  boardLabel,
  initialItems,
  onPaletteSync,
}: {
  boardLabel: string;
  initialItems: readonly BoardProps.Item<ItemData>[];
  onPaletteSync: (added?: BoardProps.Item<ItemData>, removed?: BoardProps.Item<ItemData>) => void;
}) {
  const [items, setItems] = useState(initialItems);
  return (
    <Board
      i18nStrings={boardI18nStringsWithName(boardLabel)}
      items={items}
      onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
        setItems(items);
        onPaletteSync(addedItem, removedItem);
      }}
      empty="No items"
      renderItem={(item, actions) => (
        <BoardItem
          header={<Header>{item.data.title}</Header>}
          footer={item.data.footer}
          settings={
            <ButtonDropdown
              items={[{ id: "remove", text: "Remove widget" }]}
              ariaLabel={`${boardLabel} widget settings`}
              variant="icon"
              onItemClick={() => actions.removeItem()}
              expandToViewport={true}
            />
          }
          i18nStrings={boardItemI18nStrings}
        >
          {item.data.content}
        </BoardItem>
      )}
    />
  );
}

function Palette({ paletteItems }: { paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] }) {
  return (
    <div className={classnames.palette}>
      <Header variant="h3">Add widgets (drag onto any board)</Header>
      <ItemsPalette
        items={paletteItems}
        i18nStrings={itemsPaletteI18nStrings}
        renderItem={(item) => {
          const widgetConfig = item.data;
          return (
            <BoardItem header={<Header>{widgetConfig.title}</Header>} i18nStrings={boardItemI18nStrings}>
              {widgetConfig.description}
            </BoardItem>
          );
        }}
      />
    </div>
  );
}

const boardOneItems: readonly BoardProps.Item<ItemData>[] = [
  {
    id: "1-1",
    columnSpan: 2,
    columnOffset: { 4: 0, 6: 0 },
    data: { title: "Board 1 · Widget A", description: "", content: "Content A" },
  },
  {
    id: "1-2",
    columnSpan: 2,
    columnOffset: { 4: 2, 6: 2 },
    data: { title: "Board 1 · Widget B", description: "", content: "Content B" },
  },
  {
    id: "1-3",
    columnSpan: 2,
    columnOffset: { 4: 0, 6: 0 },
    data: { title: "Board 1 · Widget C", description: "", content: "Content C" },
  },
  {
    id: "1-4",
    columnSpan: 2,
    columnOffset: { 4: 2, 6: 2 },
    data: { title: "Board 1 · Widget D", description: "", content: "Content D" },
  },
];

const boardTwoItems: readonly BoardProps.Item<ItemData>[] = [
  {
    id: "2-1",
    columnSpan: 2,
    columnOffset: { 4: 0, 6: 0 },
    data: { title: "Board 2 · Widget X", description: "", content: "Content X" },
  },
  {
    id: "2-2",
    columnSpan: 2,
    columnOffset: { 4: 2, 6: 2 },
    data: { title: "Board 2 · Widget Y", description: "", content: "Content Y" },
  },
  {
    id: "2-3",
    columnSpan: 2,
    columnOffset: { 4: 0, 6: 0 },
    data: { title: "Board 2 · Widget Z", description: "", content: "Content Z" },
  },
];

const paletteBoardItems: readonly BoardProps.Item<ItemData>[] = Object.entries(demoWidgets)
  .slice(0, 2)
  .map(([id, widget]) => ({ id, definition: widget!.definition, data: widget!.data }));

const paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] = Object.entries(demoWidgets)
  .slice(2, 5)
  .map(([id, widget]) => ({ id, definition: widget!.definition, data: widget!.data }));

const paletteOriginIds = new Set(paletteItems.map((item) => item.id));

export default function MultipleBoardsPage() {
  const [currentPaletteItems, setCurrentPaletteItems] = useState(paletteItems);
  const syncPalette = (added?: BoardProps.Item<ItemData>, removed?: BoardProps.Item<ItemData>) => {
    if (added) {
      setCurrentPaletteItems((prev) => prev.filter((item) => item.id !== added.id));
    }
    if (removed && paletteOriginIds.has(removed.id)) {
      setCurrentPaletteItems((prev) => [...prev, removed].sort((a, b) => a.data.title.localeCompare(b.data.title)));
    }
  };

  return (
    <ScreenshotArea>
      <PageLayout header={<Header variant="h1">Multiple boards on the same page</Header>}>
        <Box padding="xxl">
          <div className={classnames["layout-grid"]}>
            <SpaceBetween size="xxl">
              <div>
                <Header variant="h2">Board 1</Header>
                <DemoBoard boardLabel="Board 1" initialItems={boardOneItems} onPaletteSync={syncPalette} />
              </div>

              <div>
                <Header variant="h2">Board 2</Header>
                <DemoBoard boardLabel="Board 2" initialItems={boardTwoItems} onPaletteSync={syncPalette} />
              </div>

              <div>
                <Header variant="h2">Board 3</Header>
                <DemoBoard boardLabel="Board 3" initialItems={paletteBoardItems} onPaletteSync={syncPalette} />
              </div>
            </SpaceBetween>

            <Palette paletteItems={currentPaletteItems} />
          </div>
        </Box>
      </PageLayout>
    </ScreenshotArea>
  );
}
