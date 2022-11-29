// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors.js";
import resizeHandleStyles from "../../lib/components/internal/resize-handle/styles.selectors.js";

function setupTest(url: string, testFn: (page: ScreenshotPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "items reorder works when page is scrolled",
  setupTest("/index.html#/dnd/engine", async (page, browser) => {
    await page.setWindowSize({ width: 800, height: 1000 });
    await page.windowScrollTo({ left: 0, top: 700 });

    console.log("selector", `.${dragHandleStyles.handle}`);

    const handle7 = await browser.$(`[data-item-id="7"] .${dragHandleStyles.handle}`);
    const placeholder8 = await browser.$('[data-item-id="8"]');
    await handle7.dragAndDrop(placeholder8);

    const pngString = await page.fullPageScreenshot();
    expect(pngString).toMatchImageSnapshot();
  })
);

test(
  "items resize works when page is scrolled",
  setupTest("/index.html#/dnd/engine", async (page, browser) => {
    await page.setWindowSize({ width: 800, height: 1000 });
    await page.windowScrollTo({ left: 0, top: 700 });

    const handle7 = await browser.$(`[data-item-id="7"] .${resizeHandleStyles.handle}`);
    const placeholder8 = await browser.$('[data-item-id="8"]');
    await handle7.dragAndDrop(placeholder8);

    const pngString = await page.fullPageScreenshot();
    expect(pngString).toMatchImageSnapshot();
  })
);
