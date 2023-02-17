// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import { expect, test } from "vitest";
import { routes } from "../../pages/pages";
import { setupTest } from "../utils";

test.each(routes)("matches snapshot for %s", (route) =>
  setupTest(route, ScreenshotPageObject, async (page) => {
    const hasScreenshotArea = await page.isExisting(".screenshot-area");

    if (hasScreenshotArea) {
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }
  })()
);
