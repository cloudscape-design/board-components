// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode } from "react";
import { DashboardLayout, DashboardLayoutProps } from "../../lib/components";
import { TestBed } from "../app/test-bed";
import classnames from "./layouts.module.css";

const singleItem: DashboardLayoutProps.Item<any>[] = [
  {
    id: "1-1",
    columnSpan: 1,
    rowSpan: 1,
    definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
    columnOffset: 0,
    data: {},
  },
];

const spacedOutItems: DashboardLayoutProps.Item<any>[] = [
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

const nextRowItems: DashboardLayoutProps.Item<any>[] = [
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

export default function DashboardLayoutPage() {
  return (
    <>
      <h1>Dashboard layout</h1>
      <main>
        <TestBed>
          <DashboardLayout
            items={singleItem}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
          />
        </TestBed>
        <TestBed>
          <DashboardLayout
            items={spacedOutItems}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
          />
        </TestBed>
        <TestBed>
          <DashboardLayout
            items={nextRowItems}
            renderItem={(item) => <CustomDashboardItem>{item.id}</CustomDashboardItem>}
            onItemsChange={noop}
          />
        </TestBed>
      </main>
    </>
  );
}

function CustomDashboardItem({ children }: { children: ReactNode }) {
  return <div className={classnames.block}>{children}</div>;
}
