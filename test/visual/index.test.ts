// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import path from "path";
import { expect, test } from "vitest";

import { setupScreenshotTest } from "./utils";

interface Scenario {
  desc: string;
  url: string;
}

function pageUrl(page: string, params?: Record<string, string>) {
  const urlParams = new URLSearchParams({ screenshotMode: "true", ...params });
  return `/#${page}?${urlParams.toString()}`;
}

const ignoredPages = new Set([
  "/conditional/conditional",
  "/dnd/engine-a2p-test-async",
  "/dnd/engine-query-test",
  "/micro-frontend/integration",
  "/widget-container/keyboard",
]);
const pagesMap = import.meta.glob("../../pages/**/*.page.tsx", { query: "?raw" });
const allStaticPages = Object.keys(pagesMap)
  .map((page) => page.replace(/\.page\.tsx$/, ""))
  .map((page) => "/" + path.relative("../../pages/", page))
  .filter((page) => !ignoredPages.has(page));

const rtlStaticPages = ["/dnd/engine-a2h-test", "/with-app-layout/integ"];

const scenarios: Scenario[] = [
  ...allStaticPages.map((page) => ({ desc: `${page}-static-ltr`, url: pageUrl(page) })),
  ...rtlStaticPages.map((page) => ({ desc: `${page}-static-rtl`, url: pageUrl(page, { direction: "rtl" }) })),
];

for (const { desc, url } of scenarios) {
  test(
    `${desc}`,
    setupScreenshotTest(url, async (page) => {
      const pngString = await page.fullPageScreenshot();
      expect(pngString).toMatchImageSnapshot();
    }),
  );
}
