// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { Board } from "../../lib/components";
import { BoardData } from "../../lib/components/internal/interfaces";
import { TestBed } from "../app/test-bed";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import classnames from "./layouts.module.css";

const singleItem: BoardData<ItemData> = {
  items: [
    {
      id: "1-1",
      data: { title: "", description: "", content: "" },
    },
  ],
  layout: {},
};

const spacedOutItems: BoardData<ItemData> = {
  items: [
    {
      id: "2-1",
      data: { title: "", description: "", content: "" },
    },
    {
      id: "2-2",
      data: { title: "", description: "", content: "" },
    },
  ],
  layout: {
    4: [
      { columnSpan: 1, rowSpan: 1, columnOffset: 0 },
      { columnSpan: 1, rowSpan: 1, columnOffset: 3 },
    ],
  },
};

const nextRowItems: BoardData<ItemData> = {
  items: [
    {
      id: "3-1",
      data: { title: "", description: "", content: "" },
    },
    {
      id: "3-2",
      data: { title: "", description: "", content: "" },
    },
  ],
  layout: {
    4: [
      { columnSpan: 2, rowSpan: 1, columnOffset: 0 },
      { columnSpan: 1, rowSpan: 1, columnOffset: 0 },
    ],
  },
};

const noop = () => {
  /* readonly demos */
};

export default function BoardPage() {
  return (
    <ScreenshotArea>
      <h1>Board</h1>
      <main>
        <TestBed>
          <Board
            {...singleItem}
            i18nStrings={boardI18nStrings}
            renderItem={(item) => <CustomBoardItem>{item.id}</CustomBoardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
        <TestBed>
          <Board
            {...spacedOutItems}
            i18nStrings={boardI18nStrings}
            renderItem={(item) => <CustomBoardItem>{item.id}</CustomBoardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
        <TestBed>
          <Board
            {...nextRowItems}
            i18nStrings={boardI18nStrings}
            renderItem={(item) => <CustomBoardItem>{item.id}</CustomBoardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
      </main>
    </ScreenshotArea>
  );
}

function CustomBoardItem({ children }: { children: ReactNode }) {
  return <div className={classnames.block}>{children}</div>;
}
