// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";

class PageObject extends ScreenshotPageObject {
  containsFocused(selector: string) {
    return this.browser.execute(
      (selector) => document.querySelector(selector)!.contains(document.activeElement),
      selector
    );
  }
}

function setupTest(testFn: (browser: PageObject) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url("/index.html#/widget-container/keyboard");
    const page = new PageObject(browser);
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
    expect(await page.containsFocused(firstItem.findHeader().toSelector())).toBeTruthy();

    await page.focusNextElement();
    expect(await page.containsFocused(firstItem.findSettings().toSelector())).toBeTruthy();

    await page.focusNextElement();
    expect(await page.containsFocused(firstItem.findContent().toSelector())).toBeTruthy();

    await page.focusNextElement();
    expect(await page.containsFocused(firstItem.findFooter().toSelector())).toBeTruthy();

    await page.focusNextElement();
    expect(await page.isFocused(firstItem.findResizeHandle().toSelector())).toBeTruthy();
  })
);
