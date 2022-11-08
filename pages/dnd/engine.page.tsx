// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Box from "@cloudscape-design/components/box";
import Header from "@cloudscape-design/components/header";
import { useState } from "react";
import { DashboardItem, DashboardItemProps, DashboardLayout } from "../../lib/components";
import { initialItems, Item } from "./items";

const itemStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag me",
  resizeLabel: "Resize me",
};

export default function () {
  const [items, setItems] = useState<ReadonlyArray<Item>>(initialItems);

  return (
    <main>
      <Box padding="m">
        <DashboardLayout
          items={items}
          renderItem={(item) => (
            <DashboardItem header={<Header>Widget #{item.id}</Header>} i18nStrings={itemStrings}>
              <div>Dummy content</div>
            </DashboardItem>
          )}
          onItemsChange={(event) => setItems(event.detail.items)}
        />
      </Box>
    </main>
  );
}
