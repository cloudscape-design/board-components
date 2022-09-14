// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from "vitest";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";

function setupTest(testFn: (page: ScreenshotPageObject) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(`${process.env.TEST_HOST}`);
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible("body");
    await testFn(page);
  });
}

// Test can be removed after adding real screenshots tests
test(
  "matches index page",
  setupTest(async (page) => {
    const pngString = await page.fullPageScreenshot();
    expect(pngString).toMatchImageSnapshot();
  })
);
