// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import AppLayout from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SplitPanel from "@cloudscape-design/components/split-panel";

import { Board, BoardItem, ItemsPalette } from "../../lib/components";
import { createLetterItems } from "../dnd/items";
import {
  appLayoutI18nStrings,
  boardI18nStrings,
  boardItemI18nStrings,
  clientI18nStrings,
  itemsPaletteI18nStrings,
  splitPanelI18nStrings,
} from "../shared/i18n";

interface MicroFrontendWrapperProps {
  content: ReactNode;
}

function MicroFrontendWrapper({ content }: MicroFrontendWrapperProps) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const root = createRoot(ref.current!);
    root.render(content);

    return () => root.unmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div ref={ref} />;
}

const letterItems = createLetterItems([
  ["A", "B", "C", "D"],
  ["E", "F", "G", "H"],
  ["I", "J", "K", "L"],
])!;

export default function () {
  const [splitPanelOpen, setSplitPanelOpen] = useState(true);

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
            content={
              <Board
                items={letterItems.boardItems}
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
              content={
                <ItemsPalette
                  items={letterItems.paletteItems}
                  renderItem={(item) => (
                    <BoardItem header={<Header>{item.data.title}</Header>} i18nStrings={boardItemI18nStrings}>
                      {item.data.description}
                    </BoardItem>
                  )}
                  i18nStrings={itemsPaletteI18nStrings}
                />
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
