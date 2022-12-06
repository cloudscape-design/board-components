// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import { routes } from "../pages/pages";

function setupTest(testFn: (browser: ScreenshotPageObject["browser"]) => Promise<void>) {
  return useBrowser(async (browser) => {
    await testFn(browser);
  });
}

test.each(routes)("matches snapshot for %s", (route) => {
  return setupTest(async (browser) => {
    await browser.url(route);
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible("main");

    const hasScreenshotArea = await page.isExisting(".screenshot-area");

    if (hasScreenshotArea) {
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }
  })();
});
