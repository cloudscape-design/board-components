// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Header from "@cloudscape-design/components/header";
import { useState } from "react";
import { Board, BoardItem, BoardProps, ItemsPalette } from "../../lib/components";
import { ItemsPaletteProps } from "../../src/items-palette/interfaces";
import PageLayout from "../app/page-layout";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import classnames from "./engine.module.css";
import { ItemWidgets } from "./items";

export function EnginePageTemplate({
  initialBoardItems,
  initialPaletteItems,
  widgets,
  layout = "grid",
}: {
  initialBoardItems: readonly BoardProps.Item<ItemData>[];
  initialPaletteItems: readonly ItemsPaletteProps.Item<ItemData>[];
  widgets: ItemWidgets;
  layout?: "grid" | "absolute";
}) {
  const [boardItems, setBoardItems] = useState(initialBoardItems);
  const [paletteItems, setPaletteItems] = useState(initialPaletteItems);

  return (
    <PageLayout header={<Header variant="h1">Configurable board demo</Header>}>
      <div className={classnames[`layout-${layout}`]}>
        <Board
          i18nStrings={boardI18nStrings}
          items={boardItems}
          renderItem={(item, actions) => (
            <BoardItem
              header={<Header>{item.data.title}</Header>}
              footer={item.data.footer}
              settings={
                <ButtonDropdown
                  items={[{ id: "remove", text: "Remove widget" }]}
                  ariaLabel="Widget settings"
                  variant="icon"
                  onItemClick={() => actions.removeItem()}
                />
              }
              i18nStrings={boardItemI18nStrings}
            >
              {item.data.content}
            </BoardItem>
          )}
          onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
            setBoardItems(items);
            if (addedItem) {
              setPaletteItems((paletteItems) => paletteItems.filter((item) => item.id !== addedItem.id));
            }
            if (removedItem) {
              setPaletteItems((prev) =>
                [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title))
              );
            }
          }}
          empty="No items"
        />
        <div className={classnames.palette}>
          <Header>Add widgets</Header>
          <ItemsPalette
            items={paletteItems}
            renderItem={(item, context) => {
              const widgetConfig = widgets[item.id]!.data;
              return (
                <BoardItem header={<Header>{widgetConfig.title}</Header>} i18nStrings={boardItemI18nStrings}>
                  {context.showPreview ? `(preview) ${widgetConfig.description}` : widgetConfig.description}
                </BoardItem>
              );
            }}
            i18nStrings={itemsPaletteI18nStrings}
          />
        </div>
      </div>
    </PageLayout>
  );
}
