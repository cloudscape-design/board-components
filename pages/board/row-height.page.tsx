// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { Board, BoardItem, BoardProps } from "../../lib/components";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

const rowHeightOptions: Array<undefined | number> = [undefined, 32, 48, 64, 96];

const initialItems: ReadonlyArray<BoardProps.Item<ItemData>> = [
  {
    id: "one",
    columnSpan: 2,
    rowSpan: 2,
    definition: {},
    data: { title: "Content-light widget", description: "", content: "Two rows tall" },
  },
  {
    id: "two",
    columnSpan: 2,
    rowSpan: 4,
    definition: {},
    data: { title: "Taller widget", description: "", content: "Four rows tall" },
  },
  {
    id: "three",
    columnSpan: 2,
    rowSpan: 3,
    definition: {},
    data: { title: "Medium widget", description: "", content: "Three rows tall" },
  },
];

export default function BoardRowHeightPage() {
  const [rowHeight, setRowHeight] = useState<undefined | number>(undefined);
  const [items, setItems] = useState(initialItems);

  return (
    <ScreenshotArea>
      <Box margin="l">
        <SpaceBetween size="m">
          <Header variant="h1" description="Use the buttons to change the board row height.">
            Board row height (AWSUI-61568)
          </Header>

          <div>
            <SpaceBetween size="xs" direction="horizontal">
              {rowHeightOptions.map((option) => (
                <button
                  key={String(option)}
                  type="button"
                  data-testid={`row-height-${option ?? "default"}`}
                  aria-pressed={rowHeight === option}
                  onClick={() => setRowHeight(option)}
                >
                  {option === undefined ? "Default (96px)" : `${option}px`}
                </button>
              ))}
            </SpaceBetween>
          </div>

          <Box data-testid="current-row-height">
            Current rowHeight: {rowHeight === undefined ? "default" : rowHeight}
          </Box>

          <Board
            items={items}
            rowHeight={rowHeight}
            renderItem={(item) => (
              <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                {item.data.content}
              </BoardItem>
            )}
            i18nStrings={boardI18nStrings}
            onItemsChange={(event) => setItems(event.detail.items)}
            empty="No items"
          />
        </SpaceBetween>
      </Box>
    </ScreenshotArea>
  );
}
