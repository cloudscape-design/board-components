// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BasePageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";

export function setupTest<P extends BasePageObject & { init?(): Promise<void> }>(
  url: string,
  PageClass: new (browser: WebdriverIO.Browser) => P,
  test: (page: P) => Promise<void>
) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new PageClass(browser);

    // Default window size to ensure 4-columns layout is used.
    await page.setWindowSize({ width: 1600, height: 800 });
    await page.waitForVisible("main");

    // Custom initialization.
    page.init && (await page.init());

    await test(page);
  });
}
