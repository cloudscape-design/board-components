// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Board, BoardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import * as i18nStrings from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

export default function KeyboardPage() {
  return (
    <PageLayout header={<h1>Widget Container - Keyboard</h1>}>
      <Board<ItemData>
        i18nStrings={i18nStrings.boardI18nStrings}
        items={[
          {
            id: "1",
            columnOffset: 0,
            columnSpan: 4,
            rowSpan: 1,
            data: {
              title: "",
              description: "",
              content: null,
            },
          },
        ]}
        renderItem={() => (
          <BoardItem
            header={<span tabIndex={0}>Header</span>}
            settings={<span tabIndex={0}>Settings</span>}
            footer={<span tabIndex={0}>Footer</span>}
            i18nStrings={i18nStrings.boardItemI18nStrings}
          >
            <span tabIndex={0}>Content</span>
          </BoardItem>
        )}
        onItemsChange={() => {
          /*readonly grid*/
        }}
        empty="No items"
      />
    </PageLayout>
  );
}
