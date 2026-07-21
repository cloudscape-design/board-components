// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Header from "@cloudscape-design/components/header";

import { Board, BoardItem, BoardProps, ItemsPalette } from "../../lib/components";
import { ItemsPaletteProps } from "../../src/items-palette/interfaces";
import PageLayout from "../app/page-layout";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { createLetterItems, letterWidgets } from "./items";

// A functional-test-oriented page: two independent boards seeded with disjoint letter items.
// Board A uses A–D, board B uses E–H, so cross-board leakage (if any) would be obvious.
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
  initialItems,
}: {
  boardTestId: string;
  initialItems: readonly BoardProps.Item<ItemData>[];
}) {
  const [items, setItems] = useState(initialItems);
  return (
    <div data-testid={boardTestId}>
      <Board
        i18nStrings={boardI18nStrings}
        items={items}
        onItemsChange={({ detail }) => setItems(detail.items)}
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

// Palette items for testing cross-board keyboard insert. Items I and J are simple 1×2 widgets.
const paletteItems: readonly ItemsPaletteProps.Item<ItemData>[] = [
  { id: "I", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: letterWidgets.I.data },
  { id: "J", definition: { defaultColumnSpan: 1, defaultRowSpan: 2 }, data: letterWidgets.J.data },
];

export default function MultipleBoardsTestPage() {
  const [palette] = useState(paletteItems);
  return (
    <PageLayout header={<Header variant="h1">Multiple boards (functional test)</Header>}>
      <LetterBoard boardTestId="board-a" initialItems={boardAItems} />
      <LetterBoard boardTestId="board-b" initialItems={boardBItems} />
      <div data-testid="palette">
        <ItemsPalette
          items={palette}
          i18nStrings={itemsPaletteI18nStrings}
          renderItem={(item) => (
            <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
              {item.id}
            </BoardItem>
          )}
        />
      </div>
    </PageLayout>
  );
}
