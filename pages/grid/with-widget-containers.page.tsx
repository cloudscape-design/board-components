// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Header } from "@cloudscape-design/components";
import { Board, BoardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import { ScreenshotArea } from "../screenshot-area";
import * as i18nStrings from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

export default function GridWithWidgetContainerPage() {
  return (
    <ScreenshotArea>
      <PageLayout header={<h1>Grid with Widget Container</h1>}>
        <TestBed>
          <Board<ItemData>
            i18nStrings={i18nStrings.boardI18nStrings}
            items={[
              {
                id: "1",
                data: { title: "One", description: "", content: "Content Area" },
              },
              {
                id: "2",
                data: {
                  title: "Two",
                  description: "",
                  content: <div style={{ minHeight: 300 }}>Content Area with min-height of 300px</div>,
                },
              },
              {
                id: "3",
                data: { title: "Three", description: "", content: "Content Area" },
              },
              {
                id: "4",
                data: { title: "Four", description: "", content: "Content Area" },
              },
              {
                id: "5",
                data: { title: "Five", description: "", content: "Content Area" },
              },
            ]}
            layout={{
              4: [
                {
                  columnOffset: 0,
                  columnSpan: 2,
                  rowSpan: 1,
                },
                {
                  columnOffset: 2,
                  columnSpan: 1,
                  rowSpan: 1,
                },
                {
                  columnOffset: 3,
                  columnSpan: 1,
                  rowSpan: 1,
                },
                {
                  columnOffset: 0,
                  columnSpan: 1,
                  rowSpan: 1,
                },
                {
                  columnOffset: 2,
                  columnSpan: 2,
                  rowSpan: 2,
                },
              ],
            }}
            renderItem={(item) => (
              <BoardItem
                header={<Header variant="h2">{item.data.title}</Header>}
                i18nStrings={i18nStrings.boardItemI18nStrings}
              >
                {item.data.content}
              </BoardItem>
            )}
            onItemsChange={() => {
              /*readonly grid*/
            }}
            empty="No items"
          ></Board>
        </TestBed>
      </PageLayout>
    </ScreenshotArea>
  );
}
