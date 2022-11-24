// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import { useState } from "react";
import { DashboardItem, DashboardItemProps, DashboardLayout, DashboardPalette } from "../../lib/components";
import PageLayout from "../app/page-layout";
import classnames from "./engine.module.css";
import { createLetterItems, demoLayoutItems, demoPaletteItems, demoWidgets, letterWidgets } from "./items";

const itemStrings: DashboardItemProps["i18nStrings"] = {
  dragHandleLabel: "Drag me",
  resizeLabel: "Resize me",
};

/*
  Use letter items to reproduce test scenarious.
  
  Example input:
  [
    ["A", "B", "C"],
    ["D", "E", "C"],
    [" ", "F", " "],
    [" ", "F", " "],
  ]
*/
const letterItems = createLetterItems(null);

const widgets = !letterItems ? demoWidgets : letterWidgets;
const initialLayoutItems = !letterItems ? demoLayoutItems : letterItems.layoutItems;
const initialPaletteItems = !letterItems ? demoPaletteItems : letterItems.paletteItems;

export default function () {
  const [items, setItems] = useState(initialLayoutItems);
  const [paletteItems, setPaletteItems] = useState(initialPaletteItems);

  return (
    <PageLayout header={<Header variant="h1">Configurable dashboard demo</Header>}>
      <Grid gridDefinition={[{ colspan: 9 }, { colspan: 3 }]}>
        <DashboardLayout
          items={items}
          renderItem={(item, actions) => (
            <DashboardItem
              header={<Header>{item.data.title}</Header>}
              i18nStrings={itemStrings}
              settings={
                <ButtonDropdown
                  items={[{ id: "remove", text: "Remove widget" }]}
                  ariaLabel="Widget settings"
                  variant="icon"
                  onItemClick={() => actions.removeItem()}
                />
              }
            >
              {item.data.content}
            </DashboardItem>
          )}
          onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
            setItems(items);
            if (addedItem) {
              setPaletteItems((paletteItems) => paletteItems.filter((item) => item.id !== addedItem.id));
            }
            if (removedItem) {
              setItems((prev) => prev.filter((prevItem) => prevItem.id !== removedItem.id));
              setPaletteItems((prev) =>
                [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title))
              );
            }
          }}
        />
        <div className={classnames.palette}>
          <Header>Add widgets</Header>
          <DashboardPalette
            items={paletteItems}
            renderItem={(item) => {
              const widgetConfig = widgets[item.id]!.data;
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
