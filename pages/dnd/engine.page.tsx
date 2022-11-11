// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Header from "@cloudscape-design/components/header";
import Toggle from "@cloudscape-design/components/toggle";
import { useState } from "react";
import { DashboardItem, DashboardItemProps, DashboardLayout } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { Item, initialItems } from "./items";

const itemStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag me",
  resizeLabel: "Resize me",
};

export default function () {
  const [items, setItems] = useState<ReadonlyArray<Item>>(initialItems);
  const [bubbleUp, setBubbleUp] = useState(false);

  return (
    <PageLayout
      header={
        <Header
          variant="h1"
          actions={
            <Toggle checked={bubbleUp} onChange={(event) => setBubbleUp(event.detail.checked)}>
              Bubble up drag shadow
            </Toggle>
          }
        >
          Configurable dashboard demo
        </Header>
      }
    >
      <DashboardLayout
        {...{ bubbleUp }}
        items={items}
        renderItem={(item) => (
          <DashboardItem header={<Header>Widget #{item.id}</Header>} i18nStrings={itemStrings}>
            {item.data.content ?? <div>Dummy content</div>}
          </DashboardItem>
        )}
        onItemsChange={(event) => setItems(event.detail.items)}
      />
    </PageLayout>
  );
}
