// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";

import { Board, BoardItem, BoardProps } from "../../lib/components";
import { boardI18nStrings, boardItemI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";

export default function Conditional() {
  const [isEditable, setEditable] = useState(false);
  const [items, setItems] = useState<ReadonlyArray<BoardProps.Item<ItemData>>>([
    {
      id: "one",
      columnSpan: 2,
      rowSpan: 4,
      definition: {},
      data: { title: "First container", description: "", content: "Content" },
    },
    {
      id: "two",
      columnSpan: 2,
      definition: {},
      data: { title: "Second container", description: "", content: "Content" },
    },
    {
      id: "three",
      columnSpan: 2,
      definition: {},
      data: { title: "Last container", description: "", content: "Content" },
    },
  ]);
  return (
    <main>
      <Box margin="l">
        <Header
          variant="h1"
          actions={
            <Button data-testid="edit-toggle" onClick={() => setEditable((isEditable) => !isEditable)}>
              {isEditable ? "Save" : "Edit"}
            </Button>
          }
        >
          Dashboard
        </Header>
        <Board
          items={items}
          renderItem={(item) =>
            isEditable ? (
              <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                {item.data.content}
              </BoardItem>
            ) : (
              <Container header={<Header>{item.data.title}</Header>} fitHeight={true}>
                {item.data.content}
              </Container>
            )
          }
          i18nStrings={boardI18nStrings}
          onItemsChange={(event) => setItems(event.detail.items)}
          empty="empty"
        />
      </Box>
    </main>
  );
}
