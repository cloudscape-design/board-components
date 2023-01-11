// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { Board, BoardProps } from "../../lib/components";
import { TestBed } from "../app/test-bed";
import { ScreenshotArea } from "../screenshot-area";
import { dashboardI18nStrings } from "../shared/i18n";
import classnames from "./layouts.module.css";

const singleItem: BoardProps.Item<any>[] = [
  {
    id: "1-1",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 0,
    data: {},
  },
];

const spacedOutItems: BoardProps.Item<any>[] = [
  {
    id: "2-1",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 0,
    data: {},
  },
  {
    id: "2-2",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 3,
    data: {},
  },
];

const nextRowItems: BoardProps.Item<any>[] = [
  {
    id: "3-1",
    columnSpan: 2,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 0,
    data: {},
  },
  {
    id: "3-2",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 0,
    data: {},
  },
];

const noop = () => {
  /* readonly demos */
};

export default function BoardPage() {
  return (
    <ScreenshotArea>
      <h1>Dashboard layout</h1>
      <main>
        <TestBed>
          <Board
            i18nStrings={dashboardI18nStrings}
            items={singleItem}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
        <TestBed>
          <Board
            i18nStrings={dashboardI18nStrings}
            items={spacedOutItems}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
        <TestBed>
          <Board
            i18nStrings={dashboardI18nStrings}
            items={nextRowItems}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
            empty="No items"
          />
        </TestBed>
      </main>
    </ScreenshotArea>
  );
}

function CustomDashboardItem({ children }: { children: ReactNode }) {
  return <div className={classnames.block}>{children}</div>;
}
