// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AppLayout, Box, Button, ContentLayout, Header, SplitPanel } from "@cloudscape-design/components";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import { useState } from "react";
import { DashboardItem, DashboardLayout, DashboardPalette } from "../../lib/components";
import { demoLayoutItems, demoPaletteItems } from "../dnd/items";
import { ScreenshotArea } from "../screenshot-area";

export default function () {
  const [layoutWidgets, setLayoutWidgets] = useState(demoLayoutItems);
  const [paletteWidgets, setPaletteWidgets] = useState(demoPaletteItems);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);

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
            <DashboardLayout
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
                <DashboardItem
                  header={<Header>{item.data.title}</Header>}
                  footer={item.data.footer}
                  disableContentPaddings={item.data.disableContentPaddings}
                  i18nStrings={{
                    dragHandleLabel: "Drag me",
                    resizeLabel: "Resize me",
                  }}
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
            />
          </ContentLayout>
        }
        splitPanel={
          splitPanelOpen && (
            <SplitPanel
              header="Add widgets"
              hidePreferencesButton={true}
              i18nStrings={{
                preferencesTitle: "Split panel preferences",
                preferencesPositionLabel: "Split panel position",
                preferencesPositionDescription: "Choose the default split panel position for the service.",
                preferencesPositionSide: "Side",
                preferencesPositionBottom: "Bottom",
                preferencesConfirm: "Confirm",
                preferencesCancel: "Cancel",
                closeButtonAriaLabel: "Close panel",
                openButtonAriaLabel: "Open panel",
                resizeHandleAriaLabel: "Resize split panel",
              }}
            >
              {paletteWidgets.length > 0 ? (
                <DashboardPalette
                  items={paletteWidgets}
                  i18nStrings={{
                    dragHandleLabel: "Drag me",
                    resizeLabel: "Resize me",
                  }}
                  renderItem={(item) => (
                    <DashboardItem
                      header={<Header>{item.data.title}</Header>}
                      i18nStrings={{ dragHandleLabel: "Drag me", resizeLabel: "Resize me" }}
                    >
                      {item.data.description}
                    </DashboardItem>
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
        splitPanelPreferences={{ position: "side" }}
        splitPanelOpen={splitPanelOpen}
        onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
        ariaLabels={{
          navigation: "Side navigation",
          navigationToggle: "Open side navigation",
          navigationClose: "Close side navigation",
          notifications: "Notifications",
          tools: "Help panel",
          toolsToggle: "Open help panel",
          toolsClose: "Close help panel",
        }}
      />
    </ScreenshotArea>
  );
}
