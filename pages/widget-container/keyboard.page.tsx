// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardItem, DashboardLayout } from "../../lib/components";
import PageLayout from "../app/page-layout";
import * as i18nStrings from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

export default function KeyboardPage() {
  return (
    <PageLayout header={<h1>Widget Container - Keyboard</h1>}>
      <DashboardLayout<ItemData>
        i18nStrings={i18nStrings.dashboardI18nStrings}
        items={[
          {
            id: "1",
            columnOffset: 0,
            columnSpan: 4,
            rowSpan: 1,
            definition: {
              defaultColumnSpan: 1,
              defaultRowSpan: 1,
            },
            data: {
              title: "",
              description: "",
              content: null,
            },
          },
        ]}
        renderItem={() => (
          <DashboardItem
            i18nStrings={i18nStrings.dashboardItemI18nStrings}
            header={
              <span tabIndex={0} data-testid="header">
                Header
              </span>
            }
            settings={
              <span tabIndex={0} data-testid="settings">
                Settings
              </span>
            }
            footer={
              <span tabIndex={0} data-testid="footer">
                Footer
              </span>
            }
          >
            <span tabIndex={0} data-testid="content">
              Content
            </span>
          </DashboardItem>
        )}
        onItemsChange={() => {
          /*readonly grid*/
        }}
        empty="No items"
      />
    </PageLayout>
  );
}
