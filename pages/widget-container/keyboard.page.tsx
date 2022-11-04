// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { DashboardItem } from "../../lib/components";
import PageLayout from "../app/page-layout";
import { TestBed } from "../app/test-bed";
import * as i18nStrings from "../shared/i18n";

export default function KeyboardPage() {
  return (
    <PageLayout header={<h1>Widget Container - Keyboard</h1>}>
      <TestBed>
        <DashboardItem
          i18nStrings={i18nStrings.dashboardItem}
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
        </DashboardItem>
      </TestBed>
    </PageLayout>
  );
}
