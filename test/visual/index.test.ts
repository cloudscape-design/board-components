// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "path";
import { expect, test } from "vitest";

import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";

import { setupTest } from "../utils";

const pagesMap = import.meta.glob("../../pages/**/*.page.tsx", { as: "raw" });
const pages = Object.keys(pagesMap)
  .map((page) => page.replace(/\.page\.tsx$/, ""))
  .map((page) => "/#/" + path.relative("../../pages/", page));

test.each(pages)("matches snapshot for %s", (route) =>
  setupTest(route, ScreenshotPageObject, async (page) => {
    const hasScreenshotArea = await page.isExisting(".screenshot-area");

    if (hasScreenshotArea) {
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }
  })(),
);
