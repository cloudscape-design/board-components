// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { cropAndCompare, cropByOffset, parsePng } from "@cloudscape-design/browser-test-tools/image-utils";
import {
  BasePageObject,
  ScreenshotPageObject as BaseScreenshotPageObject,
  ScreenshotWithOffset,
} from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { allureTest } from "../vitest-reporter/fixture";

// Default window size to ensure 4-columns layout is used.
const windowSize = { width: 1600, height: 800 };

class ScreenshotPageObject extends BaseScreenshotPageObject {
  async url(url: string) {
    await this.browser.url(url);
  }
}

interface CompareFixture {
  (image: ScreenshotWithOffset): Promise<Awaited<ReturnType<typeof cropAndCompare>>>;
}

export const screenshotTest = allureTest.extend<{ page: ScreenshotPageObject; compare: CompareFixture }>({
  // eslint-disable-next-line no-empty-pattern
  page: ({}, use) => {
    return useBrowser(windowSize, async (browser) => {
      const page = new ScreenshotPageObject(browser);
      await use(page);
    })();
  },
  compare: async ({ task }, use) => {
    let counter = 0;
    const targetDir = "__image_snapshots__";
    await use(async (actual) => {
      const snapshotName = `${task.file!.name}-${task.suite.name}-${task.name}-${counter++}.png`.replaceAll("/", "-");
      if (process.env.UPDATE_SCREENSHOTS) {
        const image = await cropByOffset(actual.image, actual.offset);
        fs.writeFileSync(path.join(targetDir, snapshotName), image);
        return {
          diffPixels: 0,
          diffImage: null,
          isEqual: true,
          firstImage: image,
          secondImage: image,
        };
      } else {
        if (!fs.existsSync(path.join(targetDir, snapshotName))) {
          throw new Error(`No reference image ${snapshotName}`);
        }
        const reference = {
          ...actual,
          image: await parsePng(fs.readFileSync(path.join(targetDir, snapshotName), "base64")),
        };
        return cropAndCompare(actual, reference);
      }
    });
  },
});

export function setupTest<P extends BasePageObject & { init?(): Promise<void> }>(
  url: string,
  PageClass: new (browser: WebdriverIO.Browser) => P,
  test: (page: P) => Promise<void>
) {
  return useBrowser(windowSize, async (browser) => {
    await browser.url(url);
    const page = new PageClass(browser);
    await page.waitForVisible("main");

    // Custom initialization.
    page.init && (await page.init());

    await test(page);
  });
}

export function makeQueryUrl(board: string[][], palette: string[]) {
  const query = `board=${JSON.stringify(board)}&palette=${JSON.stringify(palette)}`;
  return `/index.html#/dnd/engine-query-test?${query}`;
}
