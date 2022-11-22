// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import { useState } from "react";
import { DashboardItem, DashboardItemProps, DashboardLayout, DashboardPalette } from "../../lib/components";
import PageLayout from "../app/page-layout";
import classnames from "./engine.module.css";
import { allWidgets, initialLayoutItems, initialPaletteItems } from "./items";

const itemStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag me",
  resizeLabel: "Resize me",
};

export default function () {
  const [items, setItems] = useState(initialLayoutItems);
  const [paletteItems, setPaletteItems] = useState(initialPaletteItems);

  return (
    <PageLayout header={<Header variant="h1">Configurable dashboard demo</Header>}>
      <Grid gridDefinition={[{ colspan: 9 }, { colspan: 3 }]}>
        <DashboardLayout
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
          resolveNewItem={(id) => paletteItems.find((item) => item.id === id) ?? null}
        />
        <div className={classnames.palette}>
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
