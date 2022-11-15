// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import Toggle from "@cloudscape-design/components/toggle";
import { useState } from "react";
import { DashboardItem, DashboardItemProps, DashboardLayout, DashboardPalette } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { allWidgets, initialLayoutItems, initialPaletteItems } from "./items";

const itemStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag me",
  resizeLabel: "Resize me",
};

export default function () {
  const [items, setItems] = useState(initialLayoutItems);
  const [paletteItems, setPaletteItems] = useState(initialPaletteItems);
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
      <Grid gridDefinition={[{ colspan: 9 }, { colspan: 3 }]}>
        <DashboardLayout
          {...{ bubbleUp }}
          items={items}
          renderItem={(item) => {
            return (
              <DashboardItem header={<Header>{item.data.title}</Header>} i18nStrings={itemStrings}>
                {item.data.content}
              </DashboardItem>
            );
          }}
          onItemsChange={(event) => {
            setItems(event.detail.items);
            if (event.detail.addedItem) {
              const addedItemId = event.detail.addedItem.id;
              setPaletteItems((paletteItems) => paletteItems.filter((item) => item.id !== addedItemId));
            }
          }}
        />
        <div>
          <Header>Add widgets</Header>
          <DashboardPalette
            items={paletteItems}
            renderItem={(item) => {
              const widgetConfig = allWidgets[item.id]!.data;
              return (
                <DashboardItem header={<Header>{widgetConfig.title}</Header>} i18nStrings={itemStrings}>
                  {widgetConfig.description}
                </DashboardItem>
              );
            }}
            i18nStrings={{}}
          />
        </div>
      </Grid>
    </PageLayout>
  );
}
