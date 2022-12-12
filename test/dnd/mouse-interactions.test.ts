// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object.js";

const wrapper = createWrapper().findDashboard();

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
  "items reorder with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      wrapper.findItemById("A").findDragHandle().toSelector(),
      wrapper.findItemById("B").findDragHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["B", "A", "C", "D"],
      ["E", "F", "G", "H"],
    ]);
  })
);

test(
  "items resize with pointer",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.dragAndDropTo(
      wrapper.findItemById("A").findResizeHandle().toSelector(),
      wrapper.findItemById("B").findResizeHandle().toSelector()
    );
    await expect(page.getGrid()).resolves.toEqual([
      ["A", "A", "B", "C"],
      ["E", "F", "G", "D"],
      [" ", " ", " ", "H"],
    ]);
  })
);
