// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import useBrowser from "@cloudscape-design/browser-test-tools/use-browser";
import { expect, test } from "vitest";
import createWrapper from "../../../lib/components/test-utils/selectors";
import { DndPageObject } from "./dnd-page-object";

const boardWrapper = createWrapper().findBoard();
const itemsPaletteWrapper = createWrapper().findItemsPalette();
const boardItemHandle = (id: string) => boardWrapper.findItemById(id).findDragHandle().toSelector();
const boardItemResizeHandle = (id: string) => boardWrapper.findItemById(id).findResizeHandle().toSelector();
const paletteItemHandle = (id: string) => itemsPaletteWrapper.findItemById(id).findDragHandle().toSelector();

function setupTest(url: string, testFn: (page: DndPageObject, browser: WebdriverIO.Browser) => Promise<void>) {
  return useBrowser(async (browser) => {
    await browser.url(url);
    const page = new DndPageObject(browser);
    await page.waitForVisible("main");
    await testFn(page, browser);
  });
}

test(
  "item reorder committed",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowDown"]);
    await page.keys(["ArrowDown"]);
    await page.keys(["Enter"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Dragging",
      "Item moved to row 2. Conflicts with Widget E.",
      "Item moved to row 3. Disturbed 1 items.",
      "reorder committed",
    ]);
  })
);

test(
  "item reorder discarded",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowRight"]);
    await page.keys(["Escape"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Dragging",
      "Item moved to column 2. Disturbed 1 items.",
      "reorder discarded",
    ]);
  })
);

test(
  "item resize committed",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemResizeHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowDown"]);
    await page.keys(["ArrowUp"]);
    await page.keys(["Enter"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Resizing",
      "Item resized to rows 3. Disturbed 1 items.",
      "Item resized to rows 2 (minimal).",
      "resize committed",
    ]);
  })
);

test(
  "item resize discarded",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemResizeHandle("A"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowRight"]);
    await page.keys(["ArrowLeft"]);
    await page.keys(["Escape"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Resizing",
      "Item resized to columns 2. Disturbed 4 items.",
      "Item resized to columns 1 (minimal).",
      "resize discarded",
    ]);
  })
);

test(
  "item insert committed",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(paletteItemHandle("I"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft"]);
    await page.keys(["ArrowDown"]);
    await page.keys(["ArrowDown"]);
    await page.keys(["Enter"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Dragging",
      "Item inserted to column 4, row 1. Disturbed 3 items.",
      "Item inserted to column 4, row 2. Disturbed 4 items.",
      "Item inserted to column 4, row 3. Disturbed 1 items.",
      "insert committed",
    ]);
  })
);

test(
  "item insert discarded",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(paletteItemHandle("I"));
    await page.keys(["Enter"]);
    await page.keys(["ArrowLeft"]);
    await page.keys(["ArrowLeft"]);
    await page.keys(["Escape"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Dragging",
      "Item inserted to column 4, row 1. Disturbed 3 items.",
      "Item inserted to column 3, row 1. Disturbed 3 items.",
      "insert discarded",
    ]);
  })
);

test(
  "item insert discarded in palette",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(paletteItemHandle("I"));
    await page.keys(["Enter"]);
    await page.keys(["Enter"]);
    await page.keys(["Enter"]);
    await page.keys(["Escape"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual([
      "Dragging",
      "Insertion discarded",
      "Dragging",
      "Insertion discarded",
    ]);
  })
);

test(
  "item removed",
  setupTest("/index.html#/dnd/engine-a2h-test", async (page) => {
    await page.focus(boardItemHandle("A"));
    await page.keys(["Tab"]);
    await page.keys(["Enter"]);
    await page.keys(["Enter"]);

    await expect(page.getLiveAnnouncements()).resolves.toEqual(["Removed item Widget A. Disturbed 1 items."]);
  })
);
