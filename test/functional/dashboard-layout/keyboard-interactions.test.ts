// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { describe, expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object";

const dashboardWrapper = createWrapper().findBoard();
const paletteWrapper = createWrapper().findItemsPalette();
const dashboardItemHandle = (id: string) => dashboardWrapper.findItemById(id).findDragHandle().toSelector();
const dashboardItemResizeHandle = (id: string) => dashboardWrapper.findItemById(id).findResizeHandle().toSelector();
const paletteItemHandle = (id: string) => paletteWrapper.findItemById(id).findDragHandle().toSelector();

function makeQueryUrl(layout: string[][], palette: string[]) {
  const query = `layout=${JSON.stringify(layout)}&palette=${JSON.stringify(palette)}`;
  return `/index.html#/dnd/engine-query-test?${query}`;
}

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
  "navigates items in the palette",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    await page.focus(paletteItemHandle("R"));
    await page.keys(["ArrowDown", "ArrowDown"]);
    await expect(page.isFocused(paletteItemHandle("T"))).resolves.toBe(true);

    await page.keys(["ArrowRight", "ArrowRight"]);
    await expect(page.isFocused(paletteItemHandle("V"))).resolves.toBe(true);

    await page.keys(["ArrowLeft", "ArrowLeft"]);
    await expect(page.isFocused(paletteItemHandle("T"))).resolves.toBe(true);

    await page.keys(["ArrowUp", "ArrowUp"]);
    await expect(page.isFocused(paletteItemHandle("R"))).resolves.toBe(true);
  })
);

test(
  "navigates items in the dashboard",
  setupTest("/index.html#/dnd/engine-a2p-test", async (page) => {
    await page.focus(dashboardItemHandle("F"));
    await page.keys(["ArrowRight", "ArrowRight"]);
    await expect(page.isFocused(dashboardItemHandle("H"))).resolves.toBe(true);

    await page.keys(["ArrowDown", "ArrowDown"]);
    await expect(page.isFocused(dashboardItemHandle("P"))).resolves.toBe(true);

    await page.keys(["ArrowLeft", "ArrowLeft"]);
    await expect(page.isFocused(dashboardItemHandle("N"))).resolves.toBe(true);

    await page.keys(["ArrowUp", "ArrowUp"]);
    await expect(page.isFocused(dashboardItemHandle("F"))).resolves.toBe(true);
  })
);

describe("items reordered with keyboard", () => {
  test(
    "item move can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(dashboardItemHandle("A"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowRight"]);
      await page.keys(["ArrowRight"]);
      await page.keys(["ArrowDown"]);
      await page.keys(["ArrowLeft"]);
      await page.keys(["ArrowUp"]);
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["B", "A", "C", "D"],
        ["B", "A", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    })
  );

  test(
    "item move can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(dashboardItemHandle("A"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowRight"]);
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    })
  );
});

describe("items resized with keyboard", () => {
  test(
    "item resize can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(dashboardItemResizeHandle("A"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowRight"]);
      await page.keys(["ArrowDown"]);
      await page.keys(["Enter"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "A", "B", "C"],
        ["A", "A", "B", "C"],
        ["A", "A", "G", "D"],
        ["E", "F", "G", "D"],
        ["E", "F", " ", "H"],
        [" ", " ", " ", "H"],
      ]);
    })
  );

  test(
    "item resize can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(dashboardItemResizeHandle("A"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowRight"]);
      await page.keys(["ArrowDown"]);
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    })
  );

  test(
    "can't resize below min row/col span",
    setupTest(
      makeQueryUrl(
        [
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
        ],
        []
      ),
      async (page) => {
        await page.focus(dashboardItemResizeHandle("X"));
        await page.keys(["Enter"]);
        await page.keys(["ArrowLeft"]);
        await page.keys(["ArrowUp"]);
        await page.keys(["Enter"]);
        await expect(page.getGrid()).resolves.toEqual([
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
          ["X", "X", " ", " "],
        ]);
      }
    )
  );
});

describe("items inserted with keyboard", () => {
  test(
    "item insert can be submitted",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(paletteItemHandle("I"));
      await page.keys(["Enter"]);

      await page.keys(["ArrowLeft"]);

      await page.keys(["ArrowDown"]);
      await page.keys(["ArrowDown"]);

      await page.keys(["ArrowDown"]);
      await page.keys(["ArrowDown"]);

      await page.keys(["Enter"]);
      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
        [" ", " ", " ", "I"],
        [" ", " ", " ", "I"],
      ]);
    })
  );

  test(
    "item insert can be discarded",
    setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
      await page.focus(paletteItemHandle("I"));
      await page.keys(["Enter"]);
      await page.keys(["ArrowDown"]);
      await page.keys(["ArrowDown"]);
      await page.keys(["Escape"]);

      await expect(page.getGrid()).resolves.toEqual([
        ["A", "B", "C", "D"],
        ["A", "B", "C", "D"],
        ["E", "F", "G", "H"],
        ["E", "F", "G", "H"],
      ]);
    })
  );
});
