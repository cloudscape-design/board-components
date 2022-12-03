// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, ButtonDropdown, SpaceBetween } from "@cloudscape-design/components";
import Header from "@cloudscape-design/components/header";
import { DashboardItem, DashboardLayout } from "../../lib/components";
import PageLayout from "../app/page-layout";
import * as i18nStrings from "../shared/i18n";

const fullWidthItem = {
  columnOffset: 0,
  columnSpan: 4,
  rowSpan: 1,
  definition: {
    defaultColumnSpan: 1,
    defaultRowSpan: 1,
  },
};

export default function WidgetContainerPermutations() {
  return (
    <PageLayout header={<h1>Widget Container</h1>}>
      <DashboardLayout<JSX.Element>
        renderItem={(item) => item.data}
        onItemsChange={() => {
          /*readonly grid*/
        }}
        items={[
          {
            id: "1",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={<Header variant="h2">Text Header</Header>}
              />
            ),
          },
          {
            id: "2",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={<Header variant="h2">Text Header with Settings</Header>}
                settings={
                  <ButtonDropdown
                    items={[
                      { id: "one", text: "One" },
                      { id: "two", text: "Two" },
                    ]}
                    variant="icon"
                  />
                }
              />
            ),
          },
          {
            id: "3",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={
                  <Header
                    variant="h2"
                    actions={
                      <SpaceBetween direction="horizontal" size="s">
                        <Button variant="normal">Normal</Button>
                        <Button variant="primary">Primary</Button>
                      </SpaceBetween>
                    }
                  >
                    Text Header with actions
                  </Header>
                }
                settings={
                  <ButtonDropdown
                    items={[
                      { id: "one", text: "One" },
                      { id: "two", text: "Two" },
                    ]}
                    variant="icon"
                  />
                }
              />
            ),
          },
          {
            id: "4",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={
                  <Header variant="h2">
                    Text Header wraps - I will make this a long title that wraps into the next line so that I can test
                    the wrapping behavior of the title. I hope this is a enough test to show the behavior.
                  </Header>
                }
                settings={
                  <ButtonDropdown
                    items={[
                      { id: "one", text: "One" },
                      { id: "two", text: "Two" },
                    ]}
                    variant="icon"
                  />
                }
              />
            ),
          },
          {
            id: "5",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={
                  <Header
                    variant="h2"
                    actions={
                      <SpaceBetween direction="horizontal" size="s">
                        <Button variant="normal">Normal</Button>
                        <Button variant="primary">Primary</Button>
                      </SpaceBetween>
                    }
                  >
                    Text Header with actions
                  </Header>
                }
              />
            ),
          },
          {
            id: "6",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                disableContentPaddings={true}
                header={<Header variant="h2">Text Header</Header>}
              >
                {() => <Box textAlign="center">Content without paddings</Box>}
              </DashboardItem>
            ),
          },
          {
            id: "7",
            ...fullWidthItem,
            data: (
              <DashboardItem
                i18nStrings={i18nStrings.dashboardItem}
                header={<Header variant="h2">Footer Content</Header>}
                footer={<Box textAlign="center">More</Box>}
              />
            ),
          },
        ]}
        empty="No items"
      />
    </PageLayout>
  );
}
