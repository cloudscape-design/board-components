// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import path from "path";
import { ContentType } from "allure-js-commons";
import { expect } from "vitest";
import { screenshotTest } from "../utils";

const pagesMap = import.meta.glob("../../pages/**/*.page.tsx", { as: "raw" });
const pages = Object.keys(pagesMap)
  .map((page) => page.replace(/\.page\.tsx$/, ""))
  .map((page) => "/#/" + path.relative("../../pages/", page));

for (const route of pages) {
  screenshotTest(`matches snapshot for ${route}`, async ({ task, allure, page, compare }) => {
    await page.url(route);
    const hasScreenshotArea = await page.isExisting(".screenshot-area");

    if (!hasScreenshotArea) {
      task.context.skip();
      return;
    }
    const screenshot = await page.captureViewport();
    const { diffImage, diffPixels, firstImage, secondImage, isEqual } = await compare(screenshot);
    allure.label("testType", "screenshotDiff");
    allure.attachment(`compareResult`, JSON.stringify({ diffPixels, isEqual }, null, 2), ContentType.JSON);
    allure.attachment(`actual`, firstImage, ContentType.PNG);
    allure.attachment(`expected`, secondImage, ContentType.PNG);

    if (diffImage) {
      allure.attachment(
        `diff`,
        JSON.stringify({
          expected: `data:image/png;base64,${secondImage.toString("base64")}`,
          actual: `data:image/png;base64,${firstImage.toString("base64")}`,
          diff: diffImage && `data:image/png;base64,${diffImage.toString("base64")}`,
        }),
        {
          contentType: "application/vnd.allure.image.diff",
          fileExtension: "json",
        }
      );
    }
    expect(isEqual).toBe(true);
  });
}
