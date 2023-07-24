// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AppLayout, Box, Button, ContentLayout, Header, SplitPanel } from "@cloudscape-design/components";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Board, BoardItem, ItemsPalette } from "../../lib/components";
import { demoBoardItems, demoPaletteItems } from "../dnd/items";
import {
  appLayoutI18nStrings,
  boardI18nStrings,
  boardItemI18nStrings,
  clientI18nStrings,
  itemsPaletteI18nStrings,
  splitPanelI18nStrings,
} from "../shared/i18n";

interface MicroFrontendWrapperProps {
  renderContent: (container: HTMLElement) => void;
}

function MicroFrontendWrapper({ renderContent }: MicroFrontendWrapperProps) {
  const ref = useRef(null);

  useEffect(() => {
    renderContent(ref.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} />;
}

export default function () {
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);

  return (
    <AppLayout
      contentType="default"
      content={
        <ContentLayout
          header={
            <Box margin={{ top: "s" }}>
              <Header
                variant="h1"
                actions={
                  <Button data-testid="add-widget" iconName="add-plus" onClick={() => setSplitPanelOpen(true)}>
                    {clientI18nStrings.appLayout.addWidgetButton}
                  </Button>
                }
              >
                {clientI18nStrings.appLayout.header}
              </Header>
            </Box>
          }
        >
          <MicroFrontendWrapper
            renderContent={(container) =>
              createRoot(container).render(
                <Board
                  items={demoBoardItems}
                  empty={clientI18nStrings.widgetsBoard.widgetsEmpty}
                  i18nStrings={boardI18nStrings}
                  onItemsChange={() => {}}
                  renderItem={(item) => (
                    <BoardItem
                      header={<Header>{item.data.title}</Header>}
                      footer={item.data.footer}
                      i18nStrings={boardItemI18nStrings}
                    >
                      {item.data.content}
                    </BoardItem>
                  )}
                />
              )
            }
          />
        </ContentLayout>
      }
      splitPanel={
        splitPanelOpen && (
          <SplitPanel
            header={clientI18nStrings.appLayout.addWidgetsHeader}
            i18nStrings={splitPanelI18nStrings}
            hidePreferencesButton={true}
          >
            <MicroFrontendWrapper
              renderContent={(container) =>
                createRoot(container).render(
                  <ItemsPalette
                    items={demoPaletteItems}
                    renderItem={(item) => (
                      <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                        {item.data.description}
                      </BoardItem>
                    )}
                    i18nStrings={itemsPaletteI18nStrings}
                  />
                )
              }
            />
          </SplitPanel>
        )
      }
      navigationHide={true}
      toolsHide={true}
      splitPanelPreferences={{ position: "side" }}
      splitPanelOpen={splitPanelOpen}
      onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
      ariaLabels={appLayoutI18nStrings}
    />
  );
}
