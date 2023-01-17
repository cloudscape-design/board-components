// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AppLayout, Box, Button, ContentLayout, Header, SplitPanel } from "@cloudscape-design/components";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import { useState } from "react";
import { Board, BoardItem, ItemsPalette } from "../../lib/components";
import { demoLayoutItems, demoPaletteItems } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";
import { boardI18nStrings, boardItemI18nStrings, itemsPaletteI18nStrings } from "../shared/i18n";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";
import { appLayoutI18nStrings, splitPanelI18nStrings } from "./i18n";

export default function () {
  const [layoutWidgets, setLayoutWidgets] = useState(demoLayoutItems);
  const [paletteWidgets, setPaletteWidgets] = useState(demoPaletteItems);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<null | string>(null);
  const [splitPanelPosition, setSpitPanelPosition] = useState<"side" | "bottom">("side");

  return (
    <ScreenshotArea>
      <AppLayout
        contentType="default"
        content={
          <ContentLayout
            header={
              <Box margin={{ top: "s" }}>
                <Header
                  variant="h1"
                  actions={
                    <Button iconName="add-plus" onClick={() => setSplitPanelOpen(true)}>
                      Add widget
                    </Button>
                  }
                >
                  Service Dashboard
                </Header>
              </Box>
            }
          >
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
          </ContentLayout>
        }
        splitPanel={
          splitPanelOpen && (
            <SplitPanel header="Add widgets" i18nStrings={splitPanelI18nStrings}>
              {paletteWidgets.length > 0 ? (
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
              )}
            </SplitPanel>
          )
        }
        navigationHide={true}
        toolsHide={true}
        splitPanelPreferences={{ position: splitPanelPosition }}
        splitPanelOpen={splitPanelOpen}
        onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
        onSplitPanelPreferencesChange={({ detail }) => setSpitPanelPosition(detail.position)}
        ariaLabels={appLayoutI18nStrings}
      />
    </ScreenshotArea>
  );
}
