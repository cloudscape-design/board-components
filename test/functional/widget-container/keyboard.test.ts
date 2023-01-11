// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";

function setupTest(testFn: (browser: ScreenshotPageObject) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url("/index.html#/widget-container/keyboard");
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible("main");

    await testFn(page);
  });
}

test(
  "follows visual tab order",
  setupTest(async (page) => {
    await page.click("h1");

    const firstItem = createWrapper().findBoardItem();

    await page.focusNextElement();
    expect(await page.isFocused(firstItem.findDragHandle().toSelector())).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused('[data-testid="header"]')).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused('[data-testid="settings"]')).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused('[data-testid="content"]')).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused('[data-testid="footer"]')).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused(firstItem.findResizeHandle().toSelector())).toBeTruthy();
  })
);
