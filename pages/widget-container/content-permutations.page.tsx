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
});

const responsive = demoWidgets.responsive!.data;
const large = demoWidgets.large!.data;
const scrollable = demoWidgets.scrollable!.data;
const allMetrics = demoWidgets.allMetrics!.data;

export default function WidgetContainerPermutations() {
  return (
    <ScreenshotArea>
      <PageLayout header={<h1>Widget container: Content permutations</h1>}>
        <Board
          i18nStrings={i18nStrings.boardI18nStrings}
          renderItem={(item) => (
            <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={i18nStrings.boardItemI18nStrings}>
              {item.data.content}
            </BoardItem>
          )}
          items={[
            // simple 1x1
            { id: "responsive-11", data: responsive },
            { id: "large-11", data: large },
            { id: "scrollable-11", data: scrollable },
            // simple 1x2
            { id: "large-12", data: large },
            { id: "scrollable-12", data: scrollable },
            // simple 2x1
            { id: "large-21", data: large },
            { id: "scrollable-21", data: scrollable },
            // simple 2x2
            { id: "large-22", data: large },
            { id: "scrollable-22", data: scrollable },
            // all metrics
            { id: "all-metrics-11", data: allMetrics },
            { id: "all-metrics-12", data: allMetrics },
            { id: "all-metrics-22", data: allMetrics },
          ]}
          layout={{
            4: [
              position(0, 1, 1),
              position(1, 1, 1),
              position(0, 1, 1),
              position(2, 1, 2),
              position(3, 1, 2),
              position(0, 2, 1),
              position(2, 2, 1),
              position(0, 2, 2),
              position(2, 2, 2),
              position(0, 1, 1),
              position(1, 1, 2),
              position(2, 2, 2),
            ],
          }}
          empty="No items"
          onItemsChange={() => {
            /*readonly grid*/
          }}
        />
      </PageLayout>
    </ScreenshotArea>
  );
}
