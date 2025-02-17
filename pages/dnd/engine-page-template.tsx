// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useState } from "react";

import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Header from "@cloudscape-design/components/header";

import { Board, BoardItem, BoardProps, ItemsPalette } from "../../lib/components";
import { ItemsPaletteProps } from "../../src/items-palette/interfaces";
import PageLayout from "../app/page-layout";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ItemData } from "../shared/interfaces";
import { ItemWidgets } from "./items";

import classnames from "./engine.module.css";

export function EnginePageTemplate({
  initialBoardItems,
  initialPaletteItems,
  widgets,
  layout = "grid",
  asyncOnChangeItems = false,
}: {
  initialBoardItems: readonly BoardProps.Item<ItemData>[];
  initialPaletteItems: readonly ItemsPaletteProps.Item<ItemData>[];
  widgets: ItemWidgets;
  layout?: "grid" | "absolute";
  asyncOnChangeItems?: boolean;
}) {
  const [boardItems, setBoardItems] = useState(initialBoardItems);
  const [paletteItems, setPaletteItems] = useState(initialPaletteItems);

  return (
    <PageLayout header={<Header variant="h1">Configurable board demo test page</Header>}>
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
                  expandToViewport={true}
                />
              }
              i18nStrings={boardItemI18nStrings}
            >
              {item.data.content}
            </BoardItem>
          )}
          onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
            if (asyncOnChangeItems) {
              setTimeout(() => {
                setBoardItems(items);
              }, 50);
            } else {
              setBoardItems(items);
            }
            if (addedItem) {
              setPaletteItems((paletteItems) => paletteItems.filter((item) => item.id !== addedItem.id));
            }
            if (removedItem) {
              setPaletteItems((prev) =>
                [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title)),
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
