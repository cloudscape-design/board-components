// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Header } from "@cloudscape-design/components";
import { useState } from "react";
import { Board, BoardItem, BoardProps, ItemsPalette, ItemsPaletteProps } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import classnames from "./engine.module.css";

export default function () {
  const [boardItems, setBoardItems] = useState<readonly BoardProps.Item<ItemData>[]>([]);
  const [paletteItems, setPaletteItems] = useState<readonly ItemsPaletteProps.Item<ItemData>[]>([
    {
      id: "D",
      definition: { defaultColumnSpan: 4, minRowSpan: 8 },
      data: { title: "", description: "", content: "" },
    },
  ]);

  const [boardWidth, setBoardWidth] = useState(800);
  let timeoutId: null | number = null;

  return (
    <ScreenshotArea>
      <PageLayout header={<Header variant="h1">In-transition layout update test page</Header>}>
        <div className={classnames[`layout-grid`]}>
          <div style={{ width: boardWidth }}>
            <Board
              i18nStrings={boardI18nStrings}
              items={boardItems}
              renderItem={(item) => (
                <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                  {item.data.content}
                </BoardItem>
              )}
              onItemsChange={({ detail: { items, addedItem } }) => {
                setBoardItems(items);
                if (addedItem) {
                  setPaletteItems((paletteItems) => paletteItems.filter((item) => item.id !== addedItem.id));
                }
              }}
              empty="No items"
            />
          </div>

          <div className={classnames.palette}>
            <Header>Add widgets</Header>
            <ItemsPalette
              items={paletteItems}
              renderItem={(item, context) => {
                if (context.showPreview === true && !timeoutId) {
                  timeoutId = setTimeout(() => {
                    setBoardWidth(1000);
                  }, 0);
                }

                return (
                  <BoardItem header={<Header>Item</Header>} i18nStrings={boardItemI18nStrings}>
                    {context.showPreview ? "Preview" : "Description"}
                  </BoardItem>
                );
              }}
              i18nStrings={itemsPaletteI18nStrings}
            />
          </div>
        </div>
      </PageLayout>
    </ScreenshotArea>
  );
}
