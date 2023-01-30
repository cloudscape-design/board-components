// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AppLayout, Box, Button, ContentLayout, Header, SpaceBetween, SplitPanel } from "@cloudscape-design/components";
import { ReactNode, useState } from "react";
import { appLayoutI18nStrings, clientI18nStrings, splitPanelI18nStrings } from "./i18n";

interface ClientAppLayoutProps {
  content: ReactNode;
  splitPanelContent: ReactNode;
  onReload: () => void;
}

export function ClientAppLayout({ content, splitPanelContent, onReload }: ClientAppLayoutProps) {
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  const [splitPanelPosition, setSplitPanelPosition] = useState<"side" | "bottom">("side");
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
                  <SpaceBetween size="s" direction="horizontal">
                    <Button variant="icon" iconName="refresh" onClick={onReload}>
                      {clientI18nStrings.appLayout.reloadButton}
                    </Button>
                    <Button data-testid="add-widget" iconName="add-plus" onClick={() => setSplitPanelOpen(true)}>
                      {clientI18nStrings.appLayout.addWidgetButton}
                    </Button>
                  </SpaceBetween>
                }
              >
                {clientI18nStrings.appLayout.header}
              </Header>
            </Box>
          }
        >
          {content}
        </ContentLayout>
      }
      splitPanel={
        splitPanelOpen && (
          <SplitPanel header={clientI18nStrings.appLayout.addWidgetsHeader} i18nStrings={splitPanelI18nStrings}>
            {splitPanelContent}
          </SplitPanel>
        )
      }
      navigationHide={true}
      toolsHide={true}
      splitPanelPreferences={{ position: splitPanelPosition }}
      splitPanelOpen={splitPanelOpen}
      onSplitPanelToggle={({ detail }) => setSplitPanelOpen(detail.open)}
      onSplitPanelPreferencesChange={({ detail }) => setSplitPanelPosition(detail.position)}
      ariaLabels={appLayoutI18nStrings}
    />
  );
}
