// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const dashboardWrapper = createWrapper().findDashboard();
const paletteWrapper = createWrapper().findPalette();

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.setWindowSize({ width: 1200, height: 800 });
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "item reorder with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      dashboardWrapper.findItemById("A").findDragHandle().toSelector(),
      dashboardWrapper.findItemById("B").findDragHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["B", "A", "C", "D"],
      ["E", "F", "G", "H"],
    ]);
  })
);

test(
  "item insert with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      paletteWrapper.findItemById("K").findDragHandle().toSelector(),
      dashboardWrapper.findItemById("H").findDragHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "B", "C", "D"],
      ["E", "F", "G", "K"],
      [" ", " ", " ", "H"],
    ]);
  })
);

test(
  "item resize with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      dashboardWrapper.findItemById("A").findResizeHandle().toSelector(),
      dashboardWrapper.findItemById("B").findResizeHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "A", "B", "C"],
      ["E", "F", "G", "D"],
      [" ", " ", " ", "H"],
    ]);
  })
);
