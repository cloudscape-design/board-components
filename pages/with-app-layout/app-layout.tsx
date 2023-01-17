// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { AppLayout, Box, Button, ContentLayout, Header, SplitPanel } from "@cloudscape-design/components";
import { ReactNode, useState } from "react";
import { ScreenshotArea } from "../screenshot-area";
import { appLayoutI18nStrings, clientI18nStrings, splitPanelI18nStrings } from "./i18n";

export function ClientAppLayout({ content, splitPanelContent }: { content: ReactNode; splitPanelContent: ReactNode }) {
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
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
                      {clientI18nStrings.appLayout.addWidgetButton}
                    </Button>
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
        onSplitPanelPreferencesChange={({ detail }) => setSpitPanelPosition(detail.position)}
        ariaLabels={appLayoutI18nStrings}
      />
    </ScreenshotArea>
  );
}
