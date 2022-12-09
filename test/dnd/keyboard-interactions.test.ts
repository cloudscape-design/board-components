// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { describe, expect, test } from "vitest";
import { DndPageObject } from "./dnd-page-object";

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "navigates items in the palette",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    await page.clickDragHandle("R");
    await page.keys(["ArrowRight"]);
    await expect(page.isDragHandleFocused("S")).resolves.toBe(true);

    await page.clickDragHandle("R");
    await page.keys(["ArrowDown"]);
    await expect(page.isDragHandleFocused("S")).resolves.toBe(true);

    await page.clickDragHandle("R");
    await page.keys(["ArrowLeft"]);
    await expect(page.isDragHandleFocused("Q")).resolves.toBe(true);

    await page.clickDragHandle("R");
    await page.keys(["ArrowUp"]);
    await expect(page.isDragHandleFocused("Q")).resolves.toBe(true);
  })
);

test(
  "navigates items in the dashboard",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    await page.clickDragHandle("F");
    await page.keys(["ArrowLeft"]);
    await expect(page.isDragHandleFocused("E")).resolves.toBe(true);

    await page.clickDragHandle("F");
    await page.keys(["ArrowRight"]);
    await expect(page.isDragHandleFocused("G")).resolves.toBe(true);

    await page.clickDragHandle("F");
    await page.keys(["ArrowUp"]);
    await expect(page.isDragHandleFocused("B")).resolves.toBe(true);

    await page.clickDragHandle("F");
    await page.keys(["ArrowDown"]);
    await expect(page.isDragHandleFocused("J")).resolves.toBe(true);
  })
);

describe("items reordered with keyboard", () => {
  test(
    "item move can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focusDragHandle("A");
      await page.keys(["ArrowRight"]);
      await page.pause(200);
      await page.keys(["ArrowRight"]);
      await page.pause(200);
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["ArrowLeft"]);
      await page.pause(200);
      await page.keys(["ArrowUp"]);
      await page.pause(200);
      await page.keys(["Enter"]);

      await expect(page.getHeaders()).resolves.toEqual([
        ["B", "A", "C", "D"],
        ["E", "F", "G", "H"],
      ]);
    })
  );

  test(
    "item move can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focusDragHandle("F");
      await page.keys(["ArrowUp"]);
      await page.pause(200);
      await page.keys(["Escape"]);

      await expect(page.getHeaders()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
      ]);
    })
  );
});

describe("items resized with keyboard", () => {
  test(
    "item resize can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.setWindowSize({ width: 1000, height: 1000 });

      await page.focusResizeHandle("A");
      await page.keys(["ArrowRight"]);
      await page.pause(200);
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["Enter"]);

      const itemSize = await page.getItemSize("A");
      expect(itemSize.width).toBeGreaterThan(200);
      expect(itemSize.height).toBeGreaterThan(520);
    })
  );

  test(
    "item resize can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.setWindowSize({ width: 1000, height: 1000 });

      await page.focusResizeHandle("A");
      await page.keys(["ArrowRight"]);
      await page.pause(200);
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["Escape"]);

      const itemSize = await page.getItemSize("A");
      expect(itemSize.width).toBeLessThan(200);
      expect(itemSize.height).toBe(260);
    })
  );
});

describe("items inserted with keyboard", () => {
  test(
    "item insert can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focusDragHandle("I");
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["Enter"]);

      expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    })
  );

  test(
    "item insert can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focusDragHandle("I");
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["ArrowDown"]);
      await page.pause(200);
      await page.keys(["Escape"]);

      expect(await page.fullPageScreenshot()).toMatchImageSnapshot();
    })
  );
});
