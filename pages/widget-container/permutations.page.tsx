// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, ButtonDropdown, SpaceBetween } from "@cloudscape-design/components";
import Header from "@cloudscape-design/components/header";

import { DashboardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import * as i18nStrings from "../shared/i18n";

export default function WidgetContainerPermutations() {
  return (
    <PageLayout header={<h1>Widget Container</h1>}>
      <TestBed>
        <DashboardItem
          i18nStrings={i18nStrings.dashboardItem}
          header={<Header variant="h2">Text Header</Header>}
        ></DashboardItem>
      </TestBed>
      <TestBed>
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
            ></ButtonDropdown>
          }
        ></DashboardItem>
      </TestBed>
      <TestBed>
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
            ></ButtonDropdown>
          }
        ></DashboardItem>
      </TestBed>
      <TestBed>
        <DashboardItem
          i18nStrings={i18nStrings.dashboardItem}
          header={
            <Header variant="h2">
              Text Header wraps - I will make this a long title that wraps into the next line so that I can test the
              wrapping behavior of the title. I hope this is a enough test to show the behavior.
            </Header>
          }
          settings={
            <ButtonDropdown
              items={[
                { id: "one", text: "One" },
                { id: "two", text: "Two" },
              ]}
              variant="icon"
            ></ButtonDropdown>
          }
        ></DashboardItem>
      </TestBed>
      <TestBed>
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
        ></DashboardItem>
      </TestBed>
      <TestBed>
        <DashboardItem
          i18nStrings={i18nStrings.dashboardItem}
          disableContentPaddings={true}
          header={<Header variant="h2">Text Header</Header>}
        >
          <Box textAlign="center">Content without paddings</Box>
        </DashboardItem>
      </TestBed>
      <TestBed>
        <DashboardItem
          i18nStrings={i18nStrings.dashboardItem}
          header={<Header variant="h2">Footer Content</Header>}
          footer={<Box textAlign="center">More</Box>}
        ></DashboardItem>
      </TestBed>
    </PageLayout>
  );
}
