// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Header } from "@cloudscape-design/components";
import { ReactNode } from "react";
import { DashboardItem, DashboardLayout } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import * as i18nStrings from "../shared/i18n";

interface ItemDefinition {
  header: string;
  content: ReactNode;
}

export default function GridWithWidgetContainerPage() {
  return (
    <PageLayout header={<h1>Grid with Widget Container</h1>}>
      <TestBed>
        <DashboardLayout<ItemDefinition>
          items={[
            {
              id: "1",
              columnOffset: 0,
              columnSpan: 2,
              rowSpan: 1,
              definition: {
                defaultColumnSpan: 0,
                defaultRowSpan: 0,
              },
              data: { header: "One", content: "Content Area" },
            },
            {
              id: "2",
              columnOffset: 2,
              columnSpan: 1,
              rowSpan: 1,
              definition: {
                defaultColumnSpan: 0,
                defaultRowSpan: 0,
              },
              data: {
                header: "Two",
                content: <div style={{ minHeight: 300 }}>Content Area with min-height of 300px</div>,
              },
            },
            {
              id: "3",
              columnOffset: 3,
              columnSpan: 1,
              rowSpan: 1,
              definition: {
                defaultColumnSpan: 1,
                defaultRowSpan: 1,
              },
              data: { header: "Three", content: "Content Area" },
            },
            {
              id: "4",
              columnOffset: 0,
              columnSpan: 1,
              rowSpan: 1,
              definition: {
                defaultColumnSpan: 1,
                defaultRowSpan: 1,
              },
              data: { header: "Four", content: "Content Area" },
            },
            {
              id: "5",
              columnOffset: 2,
              columnSpan: 2,
              rowSpan: 2,
              definition: {
                defaultColumnSpan: 1,
                defaultRowSpan: 1,
              },
              data: { header: "Five", content: "Content Area" },
            },
          ]}
          renderItem={(item) => (
            <DashboardItem
              i18nStrings={i18nStrings.dashboardItem}
              header={<Header variant="h2">{item.data.header}</Header>}
            >
              {item.data.content}
            </DashboardItem>
          )}
          onItemsChange={() => {
            /*readonly grid*/
          }}
        ></DashboardLayout>
      </TestBed>
    </PageLayout>
  );
}
