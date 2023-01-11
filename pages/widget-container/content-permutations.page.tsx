// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Header from "@cloudscape-design/components/header";
import { Board, BoardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { demoWidgets } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";
import * as i18nStrings from "../shared/i18n";

const position = (columnOffset: number, columnSpan: number, rowSpan: number) => ({
  columnOffset,
  columnSpan,
  rowSpan,
  definition: { defaultColumnSpan: 1, defaultRowSpan: 1 },
});

const responsive = demoWidgets.responsive!;
const large = demoWidgets.large!;
const scrollable = demoWidgets.scrollable!;
const allMetrics = demoWidgets.allMetrics!;

export default function WidgetContainerPermutations() {
  return (
    <ScreenshotArea>
      <PageLayout header={<h1>Widget container: Content permutations</h1>}>
        <Board
          i18nStrings={i18nStrings.dashboardI18nStrings}
          renderItem={(item) => <BoardItem header={<Header>{item.data.title}</Header>}>{item.data.content}</BoardItem>}
          items={[
            // simple 1x1
            { id: "responsive-11", ...responsive, ...position(0, 1, 1) },
            { id: "large-11", ...large, ...position(1, 1, 1) },
            { id: "scrollable-11", ...scrollable, ...position(0, 1, 1) },
            // simple 1x2
            { id: "large-12", ...large, ...position(2, 1, 2) },
            { id: "scrollable-12", ...scrollable, ...position(3, 1, 2) },
            // simple 2x1
            { id: "large-21", ...large, ...position(0, 2, 1) },
            { id: "scrollable-21", ...scrollable, ...position(2, 2, 1) },
            // simple 2x2
            { id: "large-22", ...large, ...position(0, 2, 2) },
            { id: "scrollable-22", ...scrollable, ...position(2, 2, 2) },
            // all metrics
            { id: "all-metrics-11", ...allMetrics, ...position(0, 1, 1) },
            { id: "all-metrics-12", ...allMetrics, ...position(1, 1, 2) },
            { id: "all-metrics-22", ...allMetrics, ...position(2, 2, 2) },
          ]}
          empty="No items"
          onItemsChange={() => {
            /*readonly grid*/
          }}
        />
      </PageLayout>
    </ScreenshotArea>
  );
}
