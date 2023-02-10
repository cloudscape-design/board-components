// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Box, Button, ButtonDropdown, SpaceBetween } from "@cloudscape-design/components";
import Header from "@cloudscape-design/components/header";
import { Board, BoardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { ScreenshotArea } from "../screenshot-area";
import * as i18nStrings from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

const fullWidthItem = {
  columnOffset: 0,
  columnSpan: 4,
  rowSpan: 1,
};

const items = [
  {
    id: "1",
    ...fullWidthItem,
    data: {
      title: "Text header",
      description: "",
      content: (
        <BoardItem header={<Header variant="h2">Text Header</Header>} i18nStrings={i18nStrings.boardItemI18nStrings} />
      ),
    },
  },
  {
    id: "2",
    ...fullWidthItem,
    data: {
      title: "Text header with settings",
      description: "",
      content: (
        <BoardItem
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
          i18nStrings={i18nStrings.boardItemI18nStrings}
        />
      ),
    },
  },
  {
    id: "3",
    ...fullWidthItem,
    data: {
      title: "Text header with actions",
      description: "",
      content: (
        <BoardItem
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
          i18nStrings={i18nStrings.boardItemI18nStrings}
        />
      ),
    },
  },
  {
    id: "4",
    ...fullWidthItem,
    data: {
      title: "Text header wraps",
      description: "",
      content: (
        <BoardItem
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
            />
          }
          i18nStrings={i18nStrings.boardItemI18nStrings}
        />
      ),
    },
  },
  {
    id: "5",
    ...fullWidthItem,
    data: {
      title: "Text header with actions",
      description: "",
      content: (
        <BoardItem
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
          i18nStrings={i18nStrings.boardItemI18nStrings}
        />
      ),
    },
  },
  {
    id: "6",
    ...fullWidthItem,
    data: {
      title: "Text header",
      description: "",
      content: (
        <BoardItem
          disableContentPaddings={true}
          header={<Header variant="h2">Text Header</Header>}
          i18nStrings={i18nStrings.boardItemI18nStrings}
        >
          <Box textAlign="center">Content without paddings</Box>
        </BoardItem>
      ),
    },
  },
  {
    id: "7",
    ...fullWidthItem,
    data: {
      title: "Text header",
      description: "",
      content: (
        <BoardItem
          header={<Header variant="h2">Footer Content</Header>}
          footer={<Box textAlign="center">More</Box>}
          i18nStrings={i18nStrings.boardItemI18nStrings}
        />
      ),
    },
  },
];

export default function WidgetContainerPermutations() {
  return (
    <ScreenshotArea>
      <PageLayout header={<h1>Widget Container</h1>}>
        <Board<ItemData>
          i18nStrings={i18nStrings.boardI18nStrings}
          renderItem={(item) => <>{item.data.content}</>}
          onItemsChange={() => {
            /*readonly grid*/
          }}
          items={{ small: items, full: items }}
          empty="No items"
        />
      </PageLayout>
    </ScreenshotArea>
  );
}
