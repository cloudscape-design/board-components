// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { ScreenshotPageObject } from "@cloudscape-design/browser-test-tools/page-objects";
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { describe, expect, test } from "vitest";
import dragHandleStyles from "../../lib/components/internal/drag-handle/styles.selectors.js";
import layoutItemStyles from "../../lib/components/item/styles.selectors.js";
import layoutStyles from "../../lib/components/layout/styles.selectors.js";

class DndPageObject extends ScreenshotPageObject {
  sleep(time = 200) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async getHeaders() {
    const items = await this.browser.$$(`.${layoutStyles.default.root} .${layoutItemStyles.default.header}`);
    const headers = await Promise.all([...items].map((item) => item.getText()));

    const columns = 4;
    const rows = Math.floor(headers.length / columns);
    const grid: string[][] = [...new Array(rows)].map(() => [...new Array(columns)]);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        grid[row][col] = headers[row * columns + col]?.slice("Widget ".length) ?? " ";
      }
    }

    return grid;
  }

  async clickDragHandle(id: string) {
    await this.click(`[data-item-id="${id}"] .${dragHandleStyles.default.handle}`);
  }

  async focusDragHandle(id: string) {
    await this.clickDragHandle(id);
    await this.keys(["Enter"]);
  }

  isDragHandleFocused(id: string) {
    return this.isFocused(`[data-item-id="${id}"] .${dragHandleStyles.default.handle}`);
  }
}

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
      await page.sleep();
      await page.keys(["ArrowRight"]);
      await page.sleep();
      await page.keys(["ArrowDown"]);
      await page.sleep();
      await page.keys(["ArrowLeft"]);
      await page.sleep();
      await page.keys(["ArrowUp"]);
      await page.sleep();
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
      await page.sleep();
      await page.keys(["Escape"]);
      await page.sleep();

      await expect(page.getHeaders()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
      ]);
    })
  );
});
