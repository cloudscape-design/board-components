// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { Board, BoardItem, BoardProps, ItemsPalette } from "../../lib/components";
import { ItemsPaletteProps } from "../../src/items-palette/interfaces";
import PageLayout from "../app/page-layout";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { createLetterItems, letterWidgets } from "./items";

import classnames from "./engine.module.css";

const boardAItems = createLetterItems([
  ["A", "B"],
  ["C", "D"],
])!.boardItems;
const boardBItems = createLetterItems([
  ["E", "F"],
  ["G", "H"],
])!.boardItems;

function LetterBoard({
  boardTestId,
  boardLabel,
  initialItems,
  onPaletteSync,
}: {
  boardTestId: string;
  boardLabel: string;
  initialItems: readonly BoardProps.Item<ItemData>[];
  onPaletteSync: (added?: BoardProps.Item<ItemData>, removed?: BoardProps.Item<ItemData>) => void;
}) {
  const [items, setItems] = useState(initialItems);
  return (
    <div data-testid={boardTestId}>
      <Header variant="h2">{boardLabel}</Header>
      <Board
        i18nStrings={boardI18nStrings}
        items={items}
        onItemsChange={({ detail }) => {
          setItems(detail.items);
          onPaletteSync(detail.addedItem, detail.removedItem);
        }}
        empty="No items"
        renderItem={(item) => {
          const widget = letterWidgets[item.id];
          return (
            <BoardItem header={<Header>{widget?.data.title ?? item.id}</Header>} i18nStrings={boardItemI18nStrings}>
              {item.id}
            </BoardItem>
          );
        }}
      />
    </div>
  );
}

function Palette({ paletteItems }: { paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] }) {
  return (
    <div data-testid="palette" className={classnames.palette}>
      <Header variant="h3">Palette (drag or select to add to any board)</Header>
      <ItemsPalette
        items={paletteItems}
        i18nStrings={itemsPaletteI18nStrings}
        renderItem={(item) => (
          <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
            {item.id}
          </BoardItem>
        )}
      />
    </div>
  );
}

const paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] = [
  { id: "I", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: letterWidgets.I.data },
  { id: "J", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: letterWidgets.J.data },
];

const paletteOriginIds = new Set(paletteItems.map((item) => item.id));

export default function MultipleBoardsTestPage() {
  const [palette, setPalette] = useState(paletteItems);

  // Keep palette ids unique across the page: a palette item is removed once it lands on a board, and
  // restored if it is removed from a board. Without this, an inserted item would keep its palette twin
  // and two elements would share the same id.
  const syncPalette = (added?: BoardProps.Item<ItemData>, removed?: BoardProps.Item<ItemData>) => {
    if (added) {
      setPalette((prev) => prev.filter((item) => item.id !== added.id));
    }
    if (removed && paletteOriginIds.has(removed.id)) {
      setPalette((prev) =>
        prev.some((item) => item.id === removed.id)
          ? prev
          : [...prev, { id: removed.id, definition: removed.definition, data: removed.data }],
      );
    }
  };

  return (
    <PageLayout header={<Header variant="h1">Multiple boards (functional test)</Header>}>
      <Box padding="xxl">
        <div className={classnames["layout-grid"]}>
          <SpaceBetween size="xxl">
            <LetterBoard
              boardTestId="board-a"
              boardLabel="Board A"
              initialItems={boardAItems}
              onPaletteSync={syncPalette}
            />
            <LetterBoard
              boardTestId="board-b"
              boardLabel="Board B"
              initialItems={boardBItems}
              onPaletteSync={syncPalette}
            />
            <LetterBoard
              boardTestId="board-c"
              boardLabel="Board C (empty)"
              initialItems={[]}
              onPaletteSync={syncPalette}
            />
          </SpaceBetween>

          <Palette paletteItems={palette} />
        </div>
      </Box>
    </PageLayout>
  );
}
