// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Header } from "@cloudscape-design/components";
import { DashboardItem } from "../../lib/components";
import Grid, { GridProps } from "../../lib/components/internal/grid";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import * as i18nStrings from "../shared/i18n";

export default function GridWithWidgetContainerPage() {
  const layout: GridProps["layout"] = [
    { id: "one", columnOffset: 1, columnSpan: 2, rowOffset: 1, rowSpan: 1 },
    { id: "two", columnOffset: 3, columnSpan: 1, rowOffset: 1, rowSpan: 1 },
    { id: "three", columnOffset: 4, columnSpan: 1, rowOffset: 1, rowSpan: 1 },
    { id: "four", columnOffset: 1, columnSpan: 1, rowOffset: 2, rowSpan: 1 },
    { id: "five", columnOffset: 3, columnSpan: 2, rowOffset: 2, rowSpan: 2 },
  ];
  return (
    <PageLayout header={<h1>Grid with Widget Container</h1>}>
      <TestBed>
        <Grid layout={layout} columns={4} rows={3}>
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItem}
            header={<Header variant="h2">Widget Container</Header>}
          >
            Content Area
          </DashboardItem>
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItem}
            header={<Header variant="h2">Widget Container</Header>}
          >
            <div style={{ minHeight: 300 }}>Content Area with min-height of 300px</div>
          </DashboardItem>
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItem}
            header={<Header variant="h2">Widget Container</Header>}
          >
            Content Area
          </DashboardItem>
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItem}
            header={<Header variant="h2">Widget Container</Header>}
          >
            Content Area
          </DashboardItem>
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItem}
            header={<Header variant="h2">Widget Container</Header>}
          >
            Content Area
          </DashboardItem>
        </Grid>
      </TestBed>
    </PageLayout>
  );
}
