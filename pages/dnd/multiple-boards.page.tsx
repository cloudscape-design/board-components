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

import classnames from "./multiple-boards.module.css";

// Multiple boards share one page, so a screen-reader user needs to know WHICH board an item is being
// inserted into. There is no board-name prop on the component — instead each Board is given its own
// i18nStrings, so the board name can be woven into the live announcements the board produces. This
// helper wraps the shared strings and prefixes the board's name onto both the insert-placement
// announcement AND the final commit announcement. The commit is the confirmation the user hears when
// the item is actually placed, so without the prefix it would just say "insert committed" with no
// indication of which board received the item. Because a commit only fires on the board that owns the
// item, prefixing every commit (insert/reorder/resize) with this board's name is always correct.
function boardI18nStringsWithName(boardLabel: string): BoardProps.I18nStrings<ItemData> {
  return {
    ...boardI18nStrings,
    liveAnnouncementDndItemInserted: (op) => `${boardLabel}: ${boardI18nStrings.liveAnnouncementDndItemInserted(op)}`,
    liveAnnouncementDndCommitted: (op) => `${boardLabel}: ${boardI18nStrings.liveAnnouncementDndCommitted(op)}`,
  };
}

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

// The shared `ItemsPalette`, rendered once as a persistent right-hand column next to all boards.
// Because every board shares a single d&d controller, palette widgets can be dropped onto any board
// on the page. The palette items live at the page level so that dropping a palette item onto any
// board removes it from the palette regardless of which board received it.
function Palette({ paletteItems }: { paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] }) {
  return (
    <div className={classnames.palette}>
      <Header variant="h3">Add widgets (drag onto any board)</Header>
      <ItemsPalette
        items={paletteItems}
        i18nStrings={itemsPaletteI18nStrings}
        renderItem={(item) => {
          // Render from the item's own data, not a lookup in `demoWidgets`. Items re-added to the
          // palette after being removed from any board (e.g. Board 1/2 ids like "1-1") are not keys
          // in `demoWidgets`, so a lookup there would be undefined and crash the page.
          const widgetConfig = item.data;
          // The palette intentionally shows a text description rather than the full board content
          // (which may include large containers that overflow the narrow palette card). The board's
          // renderItem shows data.content when the item is placed. This difference is inherent to the
          // palette→board UX: the palette is a summary card, the board shows the full widget.
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
        <Box padding="xxl">
          <div className={classnames["page-layout"]}>
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
