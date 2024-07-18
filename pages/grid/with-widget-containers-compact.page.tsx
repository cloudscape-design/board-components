// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Header from "@cloudscape-design/components/header";

import { Board, BoardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import { ScreenshotArea } from "../screenshot-area";
import * as i18nStrings from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { items } from "./with-widget-containers.page";

export default function GridWithWidgetContainerPage() {
  return (
    <div className="awsui-compact-mode">
      <ScreenshotArea>
        <PageLayout header={<h1>Grid with Widget Container</h1>}>
          <TestBed>
            <Board<ItemData>
              i18nStrings={i18nStrings.boardI18nStrings}
              items={items}
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
    </div>
  );
}
