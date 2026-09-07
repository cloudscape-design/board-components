// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";

import { Board, BoardItem, BoardProps } from "../../lib/components";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

const defaultColumnLayout = undefined;
const eightColumnLayout: BoardProps.ColumnLayout = { default: 1, xs: 2, s: 4, m: 6, l: 8 };

const initialItems: ReadonlyArray<BoardProps.Item<ItemData>> = Array.from({ length: 8 }, (_, index) => ({
  id: `${index + 1}`,
  columnSpan: 1,
  rowSpan: 2,
  data: {
    title: `Widget ${index + 1}`,
    description: "",
    content: "Resize the page or this board's container to change the active column count.",
  },
}));

export default function BoardColumnLayoutPage() {
  const [columnLayout, setColumnLayout] = useState<BoardProps.ColumnLayout | undefined>(eightColumnLayout);
  const [items, setItems] = useState(initialItems);

  return (
    <ScreenshotArea>
      <Box margin="l">
        <SpaceBetween size="m">
          <Header
            variant="h1"
            description="Resize the page to verify that custom column counts follow Cloudscape container breakpoints."
          >
            Responsive board columns
          </Header>

          <SpaceBetween size="xs" direction="horizontal">
            <Button
              variant={columnLayout === defaultColumnLayout ? "primary" : "normal"}
              onClick={() => setColumnLayout(defaultColumnLayout)}
            >
              Default columns
            </Button>
            <Button
              variant={columnLayout === eightColumnLayout ? "primary" : "normal"}
              onClick={() => setColumnLayout(eightColumnLayout)}
            >
              Up to eight columns
            </Button>
          </SpaceBetween>

          <Board
            columnLayout={columnLayout}
            items={items}
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
