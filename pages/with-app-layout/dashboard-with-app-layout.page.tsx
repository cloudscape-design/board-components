// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Header } from "@cloudscape-design/components";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import { useState } from "react";
import { Board, BoardItem, ItemsPalette } from "../../lib/components";
import { demoLayoutItems, demoPaletteItems } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { ClientAppLayout } from "./app-layout";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

export default function Page() {
  const [layoutWidgets, setLayoutWidgets] = useState(demoLayoutItems);
  const [paletteWidgets, setPaletteWidgets] = useState(demoPaletteItems);
  const [deleteConfirmation, setDeleteConfirmation] = useState<null | string>(null);

  return (
    <ScreenshotArea>
      <ClientAppLayout
        content={
          <Board
            i18nStrings={boardI18nStrings}
            empty={"No widgets"}
            items={layoutWidgets}
            onItemsChange={({ detail: { items, addedItem, removedItem } }) => {
              setLayoutWidgets(items);
              if (addedItem) {
                setPaletteWidgets((paletteWidgets) => paletteWidgets.filter((item) => item.id !== addedItem.id));
              }
              if (removedItem) {
                setLayoutWidgets((prev) => prev.filter((prevItem) => prevItem.id !== removedItem.id));
                setPaletteWidgets((prev) =>
                  [...prev, removedItem].sort((a, b) => a.data.title.localeCompare(b.data.title))
                );
              }
            }}
            renderItem={(item, actions) => (
              <>
                <BoardItem
                  header={<Header>{item.data.title}</Header>}
                  footer={item.data.footer}
                  settings={
                    <ButtonDropdown
                      items={[{ id: "remove", text: "Remove widget" }]}
                      ariaLabel="Widget settings"
                      variant="icon"
                      onItemClick={() => setDeleteConfirmation(item.id)}
                    />
                  }
                  i18nStrings={boardItemI18nStrings}
                >
                  {item.data.content}
                </BoardItem>

                <DeleteConfirmationModal
                  title={item.data.title}
                  visible={deleteConfirmation === item.id}
                  onDismiss={() => setDeleteConfirmation(null)}
                  onConfirm={() => {
                    actions.removeItem();
                    setDeleteConfirmation(null);
                  }}
                />
              </>
            )}
          />
        }
        splitPanelContent={
          paletteWidgets.length > 0 ? (
            <ItemsPalette
              items={paletteWidgets}
              i18nStrings={itemsPaletteI18nStrings}
              renderItem={(item) => (
                <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                  {item.data.description}
                </BoardItem>
              )}
            />
          ) : (
            "No widgets"
          )
        }
      />
    </ScreenshotArea>
  );
}
