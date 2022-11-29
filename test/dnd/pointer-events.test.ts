// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors";
import resizeHandleStyles from "../../lib/components/internal/resize-handle/styles.selectors";
import layoutStyles from "../../lib/components/layout/styles.selectors";

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

    const handle7 = await browser.$$(`.${dragHandleStyles.handle}`)[6];
    const placeholder8 = await browser.$$(`.${layoutStyles.placeholder}`)[7];
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

    const handle7 = await browser.$$(`.${resizeHandleStyles.handle}`)[6];
    const placeholder8 = await browser.$$(`.${layoutStyles.placeholder}`)[7];
    await handle7.dragAndDrop(placeholder8);

    const pngString = await page.fullPageScreenshot();
    expect(pngString).toMatchImageSnapshot();
  })
);
