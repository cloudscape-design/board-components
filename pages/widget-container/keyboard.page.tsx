// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { WidgetContainer } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import { widgetContainer } from "../shared/i18n";

export default function KeyboardPage() {
  return (
    <PageLayout header={<h1>Widget Container - Keyboard</h1>}>
      <TestBed>
        <WidgetContainer
          i18nStrings={widgetContainer}
          header={
            <span tabIndex={0} data-testid="header">
              Header
            </span>
          }
          settings={
            <span tabIndex={0} data-testid="settings">
              Settings
            </span>
          }
          footer={
            <span tabIndex={0} data-testid="footer">
              Footer
            </span>
          }
        >
          <span tabIndex={0} data-testid="content">
            Content
          </span>
        </WidgetContainer>
      </TestBed>
    </PageLayout>
  );
}
