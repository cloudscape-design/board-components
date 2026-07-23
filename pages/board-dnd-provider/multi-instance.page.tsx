// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { Board, BoardDndProvider, BoardItem, BoardProps, ItemsPalette, ItemsPaletteProps } from "../../lib/components";
import { createLetterItems } from "../dnd/items";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

const isolatedBoardOne = createLetterItems([["A", "B"]])!.boardItems;
const isolatedBoardTwo = createLetterItems([["C", "D"]])!.boardItems;
const sharedGroup = createLetterItems([["E", "F"]], ["G", "H", "I", "J"])!;

function renderBoardItem(item: BoardProps.Item<ItemData>) {
  return (
    <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
      {item.data.content}
    </BoardItem>
  );
}

function DemoBoard({
  items,
  onItemsChange,
}: {
  items: readonly BoardProps.Item<ItemData>[];
  onItemsChange: (items: readonly BoardProps.Item<ItemData>[]) => void;
}) {
  return (
    <Board<ItemData>
      items={items}
      i18nStrings={boardI18nStrings}
      empty={<Box>No items</Box>}
      onItemsChange={({ detail }) => onItemsChange(detail.items)}
      renderItem={renderBoardItem}
    />
  );
}

function DemoPalette({ items }: { items: readonly ItemsPaletteProps.Item<ItemData>[] }) {
  return (
    <ItemsPalette<ItemData>
      items={items}
      i18nStrings={itemsPaletteI18nStrings}
      renderItem={(item) => renderBoardItem(item as BoardProps.Item<ItemData>)}
    />
  );
}

/**
 * Demonstrates multiple independent Board instances on a single page using
 * `BoardDndProvider`.
 *
 * - Boards 1 and 2 are each wrapped in their own `BoardDndProvider`, so their
 *   drag-and-drop is fully isolated: you cannot drag an item from one into the
 *   other.
 * - The "shared group" wraps a palette and a board in a single
 *   `BoardDndProvider`, so items can be dragged from the palette into that board.
 */
export default function BoardDndProviderMultiInstancePage() {
  const [boardOne, setBoardOne] = useState(isolatedBoardOne);
  const [boardTwo, setBoardTwo] = useState(isolatedBoardTwo);
  const [sharedBoard, setSharedBoard] = useState(sharedGroup.boardItems);

  return (
    <SpaceBetween size="xl">
      <Header variant="h1">Board multi-instance (BoardDndProvider)</Header>

      <SpaceBetween size="l">
        <Header variant="h2">Isolated boards (separate providers)</Header>
        <div data-testid="isolated-board-1">
          <BoardDndProvider>
            <DemoBoard items={boardOne} onItemsChange={setBoardOne} />
          </BoardDndProvider>
        </div>
        <div data-testid="isolated-board-2">
          <BoardDndProvider>
            <DemoBoard items={boardTwo} onItemsChange={setBoardTwo} />
          </BoardDndProvider>
        </div>
      </SpaceBetween>

      <SpaceBetween size="l">
        <Header variant="h2">Shared group (one provider: palette + board)</Header>
        <div data-testid="shared-group">
          <BoardDndProvider>
            <SpaceBetween size="m">
              <DemoBoard items={sharedBoard} onItemsChange={setSharedBoard} />
              <DemoPalette items={sharedGroup.paletteItems} />
            </SpaceBetween>
          </BoardDndProvider>
        </div>
      </SpaceBetween>
    </SpaceBetween>
  );
}
