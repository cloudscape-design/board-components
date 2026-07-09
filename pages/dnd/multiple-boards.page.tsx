// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

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

// A small, self-contained board used multiple times on the same page. Each instance keeps its own
// items state and reacts only to its own drag-and-drop interactions. Because all boards on the page
// share a single d&d controller, an item can be dragged here from the palette too — so we forward
// added/removed items to the shared palette sync to keep the palette consistent across all boards.
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
      i18nStrings={boardI18nStrings}
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

// A board paired with a palette. Board and palette communicate through the shared d&d controller,
// so items can be inserted from the palette into this board — the legacy Board + ItemsPalette
// sibling pattern, shown here living alongside other boards on the same page. The palette items
// live at the page level so that dropping a palette item onto any board removes it from the palette.
function BoardWithPalette({
  initialBoardItems,
  paletteItems,
  onPaletteSync,
}: {
  initialBoardItems: readonly BoardProps.Item<ItemData>[];
  paletteItems: readonly ItemsPaletteProps.Item<ItemData>[];
  onPaletteSync: (added?: BoardProps.Item<ItemData>, removed?: BoardProps.Item<ItemData>) => void;
}) {
  const [boardItems, setBoardItems] = useState(initialBoardItems);
  return (
    <SpaceBetween size="l">
      <Board
        i18nStrings={boardI18nStrings}
        items={boardItems}
        empty="No items"
        onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
          setBoardItems(items);
          onPaletteSync(addedItem, removedItem);
        }}
        renderItem={(item, actions) => (
          <BoardItem
            header={<Header>{item.data.title}</Header>}
            settings={
              <ButtonDropdown
                items={[{ id: "remove", text: "Remove widget" }]}
                ariaLabel="Widget settings"
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
      <Header variant="h3">Add widgets</Header>
      <ItemsPalette
        items={paletteItems}
        i18nStrings={itemsPaletteI18nStrings}
        renderItem={(item, context) => {
          // Render from the item's own data, not a lookup in `demoWidgets`. Items re-added to the
          // palette after being removed from any board (e.g. Board 1/2 ids like "1-1") are not keys
          // in `demoWidgets`, so a lookup there would be undefined and crash the page.
          const widgetConfig = item.data;
          return (
            <BoardItem header={<Header>{widgetConfig.title}</Header>} i18nStrings={boardItemI18nStrings}>
              {context.showPreview ? `(preview) ${widgetConfig.description}` : widgetConfig.description}
            </BoardItem>
          );
        }}
      />
    </SpaceBetween>
  );
}

// Seed the demo boards with a multi-row layout (2 columns per item → a 2×2 grid). The Board engine
// only floats items straight up when an item is removed — it never shifts them sideways. With a
// single-row layout, removing a middle item would leave a permanent gap (nothing below to float up).
// A multi-row layout lets the item below float up to fill the gap, so removals reflow cleanly.
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

// Ids of the widgets that originate from the palette. Only these return to the palette when removed
// from a board — a board's own initial items (e.g. "1-1", "2-1") are not palette widgets, so removing
// them just drops them without re-populating the palette.
const paletteOriginIds = new Set(paletteItems.map((item) => item.id));

export default function MultipleBoardsPage() {
  // The palette items live here at the page level. Since every board shares a single d&d controller,
  // dropping a palette item onto any board must remove it from the palette, keeping the palette
  // consistent regardless of which board receives the item. Removing a palette-origin widget from any
  // board re-adds it; removing a board's own initial item does not add it to the palette.
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
        <SpaceBetween size="xxl">
          <div>
            <Header variant="h2">Board 1 (independent)</Header>
            <DemoBoard boardLabel="Board 1" initialItems={boardOneItems} onPaletteSync={syncPalette} />
          </div>

          <div>
            <Header variant="h2">Board 2 (independent)</Header>
            <DemoBoard boardLabel="Board 2" initialItems={boardTwoItems} onPaletteSync={syncPalette} />
          </div>

          <div>
            <Header variant="h2">Board 3 with a palette</Header>
            <BoardWithPalette
              initialBoardItems={paletteBoardItems}
              paletteItems={currentPaletteItems}
              onPaletteSync={syncPalette}
            />
          </div>
        </SpaceBetween>
      </PageLayout>
    </ScreenshotArea>
  );
}
