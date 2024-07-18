// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ReactNode, useState } from "react";

import AppLayout from "@cloudscape-design/components/app-layout";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ContentLayout from "@cloudscape-design/components/content-layout";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import SplitPanel from "@cloudscape-design/components/split-panel";

import { appLayoutI18nStrings, clientI18nStrings, splitPanelI18nStrings } from "../shared/i18n";

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
