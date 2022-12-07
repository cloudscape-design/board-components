// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors.js";

function setupTest(url: string, testFn: (page: ScreenshotPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new ScreenshotPageObject(browser);
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "navigates items in the palette",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    const handleQ = `[data-item-id="Q"] .${dragHandleStyles.default.handle}`;
    const handleR = `[data-item-id="R"] .${dragHandleStyles.default.handle}`;
    const handleS = `[data-item-id="S"] .${dragHandleStyles.default.handle}`;

    await page.click(handleR);
    await page.keys(["ArrowRight"]);
    await expect(page.isFocused(handleS)).resolves.toBe(true);

    await page.click(handleR);
    await page.keys(["ArrowDown"]);
    await expect(page.isFocused(handleS)).resolves.toBe(true);

    await page.click(handleR);
    await page.keys(["ArrowLeft"]);
    await expect(page.isFocused(handleQ)).resolves.toBe(true);

    await page.click(handleR);
    await page.keys(["ArrowUp"]);
    await expect(page.isFocused(handleQ)).resolves.toBe(true);
  })
);

test(
  "navigates items in the dashboard",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    const handleB = `[data-item-id="B"] .${dragHandleStyles.default.handle}`;
    const handleE = `[data-item-id="E"] .${dragHandleStyles.default.handle}`;
    const handleF = `[data-item-id="F"] .${dragHandleStyles.default.handle}`;
    const handleG = `[data-item-id="G"] .${dragHandleStyles.default.handle}`;
    const handleJ = `[data-item-id="J"] .${dragHandleStyles.default.handle}`;

    await page.click(handleF);
    await page.keys(["ArrowLeft"]);
    await expect(page.isFocused(handleE)).resolves.toBe(true);

    await page.click(handleF);
    await page.keys(["ArrowRight"]);
    await expect(page.isFocused(handleG)).resolves.toBe(true);

    await page.click(handleF);
    await page.keys(["ArrowUp"]);
    await expect(page.isFocused(handleB)).resolves.toBe(true);

    await page.click(handleF);
    await page.keys(["ArrowDown"]);
    await expect(page.isFocused(handleJ)).resolves.toBe(true);
  })
);
