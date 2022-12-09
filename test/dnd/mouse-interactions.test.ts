// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors.js";
import resizeHandleStyles from "../../lib/components/internal/resize-handle/styles.selectors.js";
import { DndPageObject } from "./dnd-page-object.js";

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "items reorder with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page, browser) => {
    await page.setWindowSize({ width: 1200, height: 800 });

    const handleA = await browser.$(`[data-item-id="A"] .${dragHandleStyles.default.handle}`);
    const placeholderB = await browser.$('[data-item-id="B"]');
    await handleA.dragAndDrop(placeholderB, { duration: 100 });

    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "items resize with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page, browser) => {
    await page.setWindowSize({ width: 1200, height: 800 });

    const handleA = await browser.$(`[data-item-id="A"] .${resizeHandleStyles.default.handle}`);
    const placeholderB = await browser.$('[data-item-id="B"]');
    await handleA.dragAndDrop(placeholderB, { duration: 100 });

    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);

test(
  "highlights drop location and adjusts size when over grid",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page, browser) => {
    await page.setWindowSize({ width: 1200, height: 800 });

    const handle = await browser.$(`[data-item-id="Q"] .${dragHandleStyles.default.handle}`);
    const handleRect = await browser.getElementRect(handle.elementId);
    const handleCenter = { x: handleRect.x + handleRect.width / 2, y: handleRect.y + handleRect.height / 2 };

    await handle.moveTo();
    await browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", duration: 0, origin: "pointer", ...handleCenter },
          { type: "pointerDown", button: 0 },
          { type: "pause", duration: 10 },
          { type: "pointerMove", duration: 10, origin: "pointer", x: -100, y: 0 },
        ],
      },
    ]);

    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();

    await browser.performActions([
      {
        type: "pointer",
        id: "event",
        parameters: { pointerType: "mouse" },
        actions: [{ type: "pointerMove", duration: 10, origin: "pointer", x: -100, y: 0 }],
      },
    ]);

    expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
  })
);
